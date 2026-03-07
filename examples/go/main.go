package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// ==================== Config ====================

var jwtSecret = getEnv("JWT_SECRET", "change-this-secret")

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// ==================== Models ====================

type AgentRegisterRequest struct {
	Name         string   `json:"name"`
	Capabilities []string `json:"capabilities"`
	Description  string   `json:"description,omitempty"`
	WebhookURL   string   `json:"webhook_url,omitempty"`
}

type UserAuthRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// ==================== JWT ====================

type TokenClaims struct {
	ID    string `json:"id"`
	Type  string `json:"type"` // "human" or "agent"
	Email string `json:"email,omitempty"`
	Name  string `json:"name,omitempty"`
	jwt.RegisteredClaims
}

func createToken(id, tokenType, email, name string) (string, error) {
	claims := TokenClaims{
		ID:    id,
		Type:  tokenType,
		Email: email,
		Name:  name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

func verifyToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}

// ==================== Helpers ====================

func generateID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func isBlockedHost(url string) bool {
	blocked := []string{"localhost", "127.0.0.1", "10.", "172.16.", "192.168.", "0.0.0.0"}
	for _, b := range blocked {
		if strings.Contains(url, b) {
			return true
		}
	}
	return false
}

// ==================== Middleware ====================

// Authenticate extracts and verifies the Bearer token.
// Works for both human and agent tokens.
func authenticate(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if !strings.HasPrefix(auth, "Bearer ") {
			writeJSON(w, 401, APIResponse{Error: "Missing Authorization header"})
			return
		}
		claims, err := verifyToken(auth[7:])
		if err != nil {
			writeJSON(w, 401, APIResponse{Error: "Invalid or expired token"})
			return
		}
		// Store claims in header for downstream handlers
		r.Header.Set("X-Auth-ID", claims.ID)
		r.Header.Set("X-Auth-Type", claims.Type)
		next(w, r)
	}
}

// ==================== Handlers ====================

// POST /api/agents/register - No auth required
func registerAgent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, 405, APIResponse{Error: "Method not allowed"})
		return
	}

	var req AgentRegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, APIResponse{Error: "Invalid JSON"})
		return
	}

	// Validate
	if req.Name == "" || len(req.Name) > 100 {
		writeJSON(w, 400, APIResponse{Error: "Name required (1-100 chars)"})
		return
	}
	if len(req.Capabilities) == 0 {
		writeJSON(w, 400, APIResponse{Error: "At least one capability required"})
		return
	}
	if req.WebhookURL != "" && isBlockedHost(req.WebhookURL) {
		writeJSON(w, 400, APIResponse{Error: "Webhook cannot point to private addresses"})
		return
	}

	agentID := generateID()
	apiToken, err := createToken(agentID, "agent", "", req.Name)
	if err != nil {
		writeJSON(w, 500, APIResponse{Error: "Failed to generate token"})
		return
	}

	// TODO: Save to database

	writeJSON(w, 201, APIResponse{
		Success: true,
		Data: map[string]string{
			"agent_id":  agentID,
			"api_token": apiToken,
			"status":    "registered",
			"dashboard": fmt.Sprintf("/dashboard/agents/%s", agentID),
		},
	})
}

// POST /api/users/signup - No auth required
func signup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, 405, APIResponse{Error: "Method not allowed"})
		return
	}

	var req UserAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, APIResponse{Error: "Invalid JSON"})
		return
	}

	if req.Email == "" || req.Password == "" {
		writeJSON(w, 400, APIResponse{Error: "Email and password required"})
		return
	}
	if len(req.Password) < 8 {
		writeJSON(w, 400, APIResponse{Error: "Password must be 8+ characters"})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		writeJSON(w, 500, APIResponse{Error: "Failed to hash password"})
		return
	}
	_ = hash // TODO: Save to database

	userID := generateID()
	token, err := createToken(userID, "human", req.Email, "")
	if err != nil {
		writeJSON(w, 500, APIResponse{Error: "Failed to generate token"})
		return
	}

	writeJSON(w, 201, APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"token": token,
			"user":  map[string]string{"id": userID, "email": req.Email},
		},
	})
}

// POST /api/users/login - No auth required
func login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, 405, APIResponse{Error: "Method not allowed"})
		return
	}

	var req UserAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, 400, APIResponse{Error: "Invalid JSON"})
		return
	}

	if req.Email == "" || req.Password == "" {
		writeJSON(w, 400, APIResponse{Error: "Email and password required"})
		return
	}

	// TODO: Look up user and verify password with bcrypt.CompareHashAndPassword

	token, err := createToken("user-id-from-db", "human", req.Email, "")
	if err != nil {
		writeJSON(w, 500, APIResponse{Error: "Failed to generate token"})
		return
	}

	writeJSON(w, 200, APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"token": token,
			"user":  map[string]string{"id": "user-id-from-db", "email": req.Email},
		},
	})
}

// GET /api/health
func health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

// ==================== Main ====================

func main() {
	mux := http.NewServeMux()

	// Serve skill.md as static file
	mux.Handle("/skill.md", http.FileServer(http.Dir(".")))

	// Public routes (no auth)
	mux.HandleFunc("/api/agents/register", registerAgent)
	mux.HandleFunc("/api/users/signup", signup)
	mux.HandleFunc("/api/users/login", login)
	mux.HandleFunc("/api/health", health)

	// Protected route example
	mux.HandleFunc("/api/agents", authenticate(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, APIResponse{Success: true, Data: []string{}})
	}))

	port := getEnv("PORT", "3001")
	log.Printf("Server running on port %s", port)
	log.Printf("Skill.md available at http://localhost:%s/skill.md", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
