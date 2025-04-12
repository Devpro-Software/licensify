package main

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (s *Server) setupAuthEndpoints(gauth *gin.RouterGroup, gapi *gin.RouterGroup) {
	gauth.POST("/register", func(ctx *gin.Context) {
		var req struct {
			Username  string `json:"username"`
			Password  string `json:"password"`
			FirstName string `json:"firstName"`
			LastName  string `json:"lastName"`
		}

		if err := ctx.BindJSON(&req); err != nil {
			http.Error(ctx.Writer, "Invalid request", http.StatusBadRequest)
			return
		}

		var existing User
		err := s.db.First(&existing, "username = ?", req.Username).Error
		if err == nil {
			http.Error(ctx.Writer, "Invalid", http.StatusBadRequest)
			return
		}

		if !errors.Is(err, gorm.ErrRecordNotFound) {
			internalError(ctx, err)
			return
		}

		user := &User{}
		user.ID = uuid.New().String()
		user.Username = req.Username
		user.Password = req.Password // TODO: hash
		user.Role = "Admin"
		user.FirstName = req.FirstName
		user.LastName = req.LastName
		if err := s.db.Create(user).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusCreated, user)
	})

	gauth.POST("/login", func(ctx *gin.Context) {
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		if err := ctx.BindJSON(&req); err != nil {
			http.Error(ctx.Writer, "Invalid request", http.StatusBadRequest)
			return
		}

		var user User
		err := s.db.First(&user, "username = ?", req.Username).Error
		if err != nil {
			http.Error(ctx.Writer, "", http.StatusUnauthorized)
			return
		}

		if user.Password != req.Password {
			http.Error(ctx.Writer, "", http.StatusUnauthorized)
			return
		}
		bytes := make([]byte, 32)
		if _, err := rand.Read(bytes); err != nil {
			internalError(ctx, err)
			return
		}
		token := base64.URLEncoding.EncodeToString(bytes)

		session := &Session{}
		session.ID = uuid.New().String()
		session.Token = token
		session.Expires = time.Now().Add(time.Hour * 24 * 7)
		session.UserID = user.ID
		session.User = &user

		if err := s.db.Create(session).Error; err != nil {
			internalError(ctx, err)
			return
		}

		http.SetCookie(ctx.Writer, &http.Cookie{
			Name:     "session_token",
			Value:    token,
			Expires:  session.Expires,
			HttpOnly: true,
			Secure:   false, // Use true in production with HTTPS
			SameSite: http.SameSiteStrictMode,
			Path:     "/",
		})

		ctx.JSON(http.StatusOK, gin.H{"message": "Login successful"})
	})

	gauth.POST("/logout", func(ctx *gin.Context) {
		s.authMiddleware(ctx)
		session := s.session(ctx)
		s.db.Delete(session)
		ctx.SetCookie("session_token", "", -1, "/", "", false, true) // Expires immediately
	})

	gapi.GET("/session", func(ctx *gin.Context) {
		session := s.session(ctx)
		if session == nil {
			ctx.Status(http.StatusUnauthorized)
			return
		}

		ctx.JSON(http.StatusOK, session)
	})

	gapi.PUT("/profile", func(c *gin.Context) {
		var req struct {
			FirstName string `json:"firstName"`
			LastName  string `json:"lastName"`
		}

		if err := c.BindJSON(&req); err != nil {
			http.Error(c.Writer, "Invalid request", http.StatusBadRequest)
			return
		}
		session := s.session(c)
		session.User.FirstName = req.FirstName
		session.User.LastName = req.LastName
		if err := s.db.Save(session.User).Error; err != nil {
			internalError(c, err)
			return
		}

		c.Status(http.StatusOK)
	})
}

func (s *Server) session(ctx *gin.Context) *Session {
	session, exists := ctx.Get("session")
	if !exists {
		return nil
	}

	sess, ok := session.(Session)
	if !ok {
		return nil
	}

	return &sess
}

func (s *Server) authMiddleware(ctx *gin.Context) {
	if !s.prod {
		var user User
		if s.db.First(&user, "username = ?", "john").Error != nil {
			panic("failed to retrieve test user")
		}

		ctx.Set("session", testSession(&user))
		return
	}
	cookie, err := ctx.Cookie("session_token")
	if err != nil {
		ctx.Abort()
		return
	}

	var session Session
	err = s.db.Preload("User").First(&session, "token = ?", cookie).Error
	if err != nil {
		ctx.Abort()
		return
	}

	if time.Now().After(session.Expires) {
		s.db.Delete(&session)
		ctx.Abort()
		return
	}

	ctx.Set("session", session)
}

func (s *Server) createTestUser() {
	user := &User{}
	user.ID = uuid.NewString()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	user.Username = "john"
	user.FirstName = "john"
	user.LastName = "pork"
	s.db.Create(user)
}

func testSession(u *User) Session {
	testSession := Session{}
	testSession.ID = "3eeec35e-c292-4c06-a01f-eb3a7ec75fec"
	testSession.CreatedAt = time.Now()
	testSession.UpdatedAt = time.Now()
	testSession.Token = "ac2d416c-e674-4956-ba2f-2ed3c06a4ae9"
	testSession.Expires = time.Now().Add(time.Hour)
	testSession.User = u
	return testSession
}
