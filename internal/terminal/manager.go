package terminal

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"syscall"

	gopty "github.com/aymanbagabas/go-pty"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"

	"forge/internal/db"
)

type Session struct {
	ID  string
	Cmd *gopty.Cmd
	PTY gopty.Pty

	connMu sync.Mutex
	conn   *websocket.Conn
}

type Manager struct {
	mu       sync.RWMutex
	sessions map[string]*Session
	db       *gorm.DB
}

func NewManager(database *gorm.DB) *Manager {
	m := &Manager{
		sessions: make(map[string]*Session),
		db:       database,
	}
	m.cleanupDead()
	return m
}

func (m *Manager) Create(name, cwd string) (*Session, error) {

	shell := os.Getenv("SHELL")
	var shellArgs []string
	if shell == "" {
		if ps, err := exec.LookPath("powershell.exe"); err == nil {
			shell = ps

			shellArgs = []string{"-NoProfile", "-NoExit"}
		} else if comspec := os.Getenv("COMSPEC"); comspec != "" {
			shell = comspec
		} else {
			shell = "cmd.exe"
		}
	}
	log.Printf("terminal: starting shell %s %s", shell, strings.Join(shellArgs, " "))

	ptmx, err := gopty.New()
	if err != nil {
		return nil, fmt.Errorf("create pty: %w", err)
	}

	cmd := ptmx.Command(shell, shellArgs...)
	cmd.Dir = cwd
	cmd.Env = append(os.Environ(), "TERM=xterm-256color")

	if err := cmd.Start(); err != nil {
		ptmx.Close()
		return nil, fmt.Errorf("start shell: %w", err)
	}

	sess := &Session{
		ID:  uuid.NewString(),
		Cmd: cmd,
		PTY: ptmx,
	}

	m.mu.Lock()
	m.sessions[sess.ID] = sess
	m.mu.Unlock()

	record := db.Session{
		ID:   sess.ID,
		Name: name,
		Cwd:  cwd,
		Pid:  cmd.Process.Pid,
	}
	m.db.Create(&record)

	return sess, nil
}

func (m *Manager) Get(id string) (*Session, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	sess, ok := m.sessions[id]
	return sess, ok
}

func (m *Manager) List() []db.Session {
	var sessions []db.Session
	m.db.Find(&sessions)
	return sessions
}

func (m *Manager) Delete(id string) {
	m.mu.Lock()
	sess, ok := m.sessions[id]
	if ok {
		sess.PTY.Close()
		sess.Cmd.Process.Kill()
		delete(m.sessions, id)
	}
	m.mu.Unlock()

	m.db.Delete(&db.Session{}, "id = ?", id)
}

func (s *Session) Attach(conn *websocket.Conn) {
	s.connMu.Lock()
	if s.conn != nil {
		s.conn.Close()
	}
	s.conn = conn
	s.connMu.Unlock()

	done := make(chan struct{})

	go func() {
		defer close(done)
		defer conn.Close()
		buf := make([]byte, 32*1024)
		for {
			n, err := s.PTY.Read(buf)
			if n > 0 {
				if writeErr := conn.WriteMessage(websocket.BinaryMessage, buf[:n]); writeErr != nil {
					return
				}
			}
			if err != nil {
				log.Printf("terminal: PTY read ended for session %s: %v", s.ID, err)
				return
			}
		}
	}()

	for {
		msgType, data, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if msgType == websocket.TextMessage {
			s.handleControl(data)
			continue
		}
		s.PTY.Write(data)
	}

	<-done

	s.connMu.Lock()
	if s.conn == conn {
		s.conn = nil
	}
	s.connMu.Unlock()
}

type resizeMsg struct {
	Cols int `json:"cols"`
	Rows int `json:"rows"`
}

func (s *Session) handleControl(data []byte) {
	var msg resizeMsg
	if err := json.Unmarshal(data, &msg); err != nil {
		return
	}
	if msg.Cols == 0 || msg.Rows == 0 {
		return
	}

	s.PTY.Resize(msg.Cols, msg.Rows)
}

func (m *Manager) cleanupDead() {
	var sessions []db.Session
	m.db.Find(&sessions)
	log.Printf("terminal: cleanupDead found %d session(s) in SQLite", len(sessions))
	for _, s := range sessions {
		if !isAlive(s.Pid) {
			result := m.db.Delete(&db.Session{}, "id = ?", s.ID)
			if result.Error != nil {
				log.Printf("terminal: failed to delete session %s: %v", s.ID, result.Error)
			} else {
				log.Printf("terminal: deleted stale session %s (pid %d)", s.ID, s.Pid)
			}
		}
	}
}

func isAlive(pid int) bool {
	if pid <= 0 {
		return false
	}
	if runtime.GOOS == "windows" {

		return false
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	return proc.Signal(syscall.Signal(0)) == nil
}
