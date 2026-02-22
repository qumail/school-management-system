# School Management System API Documentation

## Base Information

- **Base URL**: `http://localhost:3000/api`
- **API Version**: 1.0.0
- **Content Type**: `application/json`

---

## Rate Limiting

## Overview

The School Management System API implements rate limiting to ensure fair usage and prevent abuse. Limits are applied based on IP address and user identity.

Endpoint Type	Limit	Window
General API	100 requests	15 minutes
Authentication (login/register)	10 attempts	1 hour
School Creation	5 creations	1 hour

## Rate Limit Tiers

| Tier | Limit | Window | Affected Endpoints |
|------|-------|--------|-------------------|
| General API | 100 requests | 15 minutes | All standard CRUD endpoints |
| Authentication | 10 attempts | 1 hour | `/auth/login`, `/auth/register`, `/auth/refresh-token` |
| School Creation | 5 creations | 1 hour | `POST /schools` |

## Rate Limit Headers

All responses include:

| Header | Description |
|--------|-------------|
| `RateLimit-Limit` | Maximum requests allowed |
| `RateLimit-Remaining` | Requests remaining |
| `RateLimit-Reset` | Seconds until reset |


RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 840


---

## When Limit is Exceeded

**Status Code:** `429 Too Many Requests`

**Response Body:**
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again after 15 minutes"
}

**For authentication endpoints:**

{
  "success": false,
  "error": "Too many authentication attempts, please try again after an hour"
}

Best Practices for Clients
Monitor Headers - Track RateLimit-Remaining to avoid hitting limits

Implement Backoff - When rate limited, wait and retry with exponential backoff

Cache Responses - Cache frequently accessed data to reduce API calls

Exceptions
The following are not rate limited:

GET /health - Health check endpoint

OPTIONS requests - CORS preflight

## ⚙️ Implementation

Rate limiting is implemented using `express-rate-limit` with environment-based configuration. Limits reset automatically after the window period expires.