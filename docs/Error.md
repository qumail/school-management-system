# School Management System API Documentation

## Base Information

- **Base URL**: `http://localhost:3000/api`
- **API Version**: 1.0.0
- **Content Type**: `application/json`

---


## Error Codes Summary

# Error Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| **400** | Bad Request | Missing required fields, invalid data format, validation failed |
| **401** | Unauthorized | Missing or invalid token, expired token |
| **403** | Forbidden | Authenticated but insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists (duplicate email/name) |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Database error, unhandled exception |

## Error Response Format
```json
{
  "success": false,
  "error": "Descriptive error message"
}