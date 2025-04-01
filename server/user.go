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

func (s *Server) setupUserEndpoints(gr *gin.RouterGroup) {
	gr.POST("/register", func(ctx *gin.Context) {
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
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
		if err := s.db.Create(user).Error; err != nil {
			internalError(ctx, err)
			return
		}

		ctx.JSON(http.StatusOK, user)
	})

	gr.POST("/login", func(ctx *gin.Context) {
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
}

func (s *Server) authMiddleware(ctx *gin.Context) {
	cookie, err := ctx.Cookie("session_token")
	if err != nil {
		ctx.Abort()
		return
	}

	var session Session
	err = s.db.First(&session, "token = ?", cookie).Error
	if err != nil {
		ctx.Abort()
		return
	}

	if time.Now().After(session.Expires) {
		s.db.Delete(&session)
		ctx.Abort()
		return
	}
}
