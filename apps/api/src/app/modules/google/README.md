# Google Module

## Overview

The Google module provides comprehensive integration with various Google services, enabling secure OAuth2 authentication and programmatic access management across multiple Google platforms. This module acts as a centralized hub for managing user permissions and access control for Google services.

## Architecture

### Core Components

1. **Controller** (`google.controller.ts`)
   - REST API endpoints for Google service operations
   - Handles authentication, authorization, and access management requests
   - Routes: `/google/*`

2. **Service** (`google.service.ts`)
   - Business logic for Google API interactions
   - Manages OAuth2 token lifecycle
   - Coordinates access control across different Google services

3. **Service-Specific Implementations**
   - `google-ads.service.ts` - Google Ads account management
   - `google-analytics.service.ts` - Google Analytics property access
   - `google-tag-manager.service.ts` - GTM container permissions
   - `google-search-console.service.ts` - Search Console site access
   - `google-merchant-center.service.ts` - Merchant Center management
   - `google-my-business.service.ts` - Business profile access control

## Supported Google Services

| Service | Description | Key Features |
|---------|-------------|--------------|
| **Google Ads** | Advertising platform management | Account access, campaign permissions, view/admin roles |
| **Google Analytics** | Web analytics access control | Property management, user permissions, data access levels |
| **Tag Manager** | GTM container management | Container access, workspace permissions, publishing rights |
| **Search Console** | Website performance monitoring | Site verification, property access, data viewing permissions |
| **Merchant Center** | Product feed management | Account access, feed permissions, shopping campaigns |
| **My Business** | Business profile management | Location access, review management, post permissions |

## Data Transfer Objects (DTOs)

All DTOs implement interfaces from `@clientfuse/models` for type safety across frontend and backend:

### Connection DTOs
- `IGoogleConnectionDto` - Initial OAuth connection with ID and access tokens
- `ISetCredentialsDto` - Token refresh/update operations

### Access Management DTOs
- `IGrantManagementAccessDto` - Grant full management permissions
- `IGrantViewAccessDto` - Grant view access
- `IRevokeAgencyAccessDto` - Revoke existing access

### Query DTOs
- `IGetUserAccountsDto` - Retrieve user's connected accounts
- `IGetEntityUsersQueryDto` - Get users with entity access

## API Endpoints

### Authentication
```
POST /google/connect
Body: IGoogleConnectionDto
Description: Establish initial Google OAuth connection
```

### Token Management
```
POST /google/set-credentials
Body: ISetCredentialsDto
Description: Update/refresh OAuth tokens
```

### Access Control
```
POST /google/grant-management-access
Body: IGrantManagementAccessDto
Description: Grant full management permissions to a service

POST /google/grant-view-access
Body: IGrantViewAccessDto
Description: Grant view access to a service

POST /google/revoke-agency-access
Body: IRevokeAgencyAccessDto
Description: Revoke existing access permissions
```

### Account Management
```
GET /google/accounts?userId={userId}
Description: Get all connected Google accounts for a user

GET /google/entity-users?userId={userId}
Description: Get all users with access to an entity
```

## Permission Types

### Service-Specific Permissions

**Google Analytics**
- `COLLABORATE` - View and collaborate
- `EDIT` - Edit configuration
- `MANAGE_USERS` - Manage user access
- `READ_AND_ANALYZE` - Read and analyze data

**Google Ads**
- `ADMIN` - Full administrative access
- `STANDARD` - Standard user access
- `READ_ONLY` - View-only access
- `EMAIL_ONLY` - Email notifications only

**Tag Manager**
- `read` - View containers and versions
- `edit` - Edit containers
- `delete` - Delete containers
- `publish` - Publish versions

**Search Console**
- `FULL` - Full access
- `RESTRICTED` - Limited access

**Merchant Center**
- `ADMIN` - Administrative access
- `STANDARD` - Standard user access

**My Business**
- `OWNER` - Full ownership
- `MANAGER` - Management access
- `SITE_MANAGER` - Website management only

## OAuth2 Scopes

The module requests the following OAuth2 scopes:

```typescript
- https://www.googleapis.com/auth/userinfo.email
- https://www.googleapis.com/auth/userinfo.profile
- https://www.googleapis.com/auth/analytics.manage.users
- https://www.googleapis.com/auth/analytics.readonly
- https://www.googleapis.com/auth/adwords
- https://www.googleapis.com/auth/tagmanager.manage.users
- https://www.googleapis.com/auth/tagmanager.readonly
- https://www.googleapis.com/auth/webmasters.readonly
- https://www.googleapis.com/auth/content
- https://www.googleapis.com/auth/business.manage
```

## Usage Examples

### Connecting a Google Account
```typescript
// Frontend
const connectionData: IGoogleConnectionDto = {
  idToken: 'google_id_token',
  accessToken: 'google_access_token'
};

await api.post('/google/connect', connectionData);
```

### Granting Management Access
```typescript
// Grant analytics management access
const accessRequest: IGrantManagementAccessDto = {
  userId: 'user_123',
  service: 'analytics',
  entityId: 'GA_PROPERTY_ID',
  agencyEmail: 'agency@example.com'
};

await api.post('/google/grant-management-access', accessRequest);
```

### Revoking Access
```typescript
const revokeRequest: IRevokeAgencyAccessDto = {
  userId: 'user_123',
  service: 'analytics',
  entityId: 'GA_PROPERTY_ID',
  linkId: 'link_456'
};

await api.post('/google/revoke-agency-access', revokeRequest);
```

## Development Guidelines

### Adding a New Google Service

1. Create service file: `google-[service].service.ts`
2. Implement `IGoogleBaseAccessService` interface
3. Add service-specific permission types to models
4. Update controller with new endpoints
5. Add DTOs if service requires custom parameters
6. Update this README with service details

## Dependencies

- `@nestjs/common` - NestJS framework
- `googleapis` - Official Google APIs client
- `google-auth-library` - OAuth2 authentication
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation
- `@clientfuse/models` - Shared type definitions

## Troubleshooting

### Common Issues

1. **"Invalid grant" error**
   - Token has expired or been revoked
   - Solution: Re-authenticate user through OAuth flow

2. **"Insufficient permissions" error**
   - Missing required OAuth scopes
   - Solution: Re-authorize with additional scopes

3. **"Entity not found" error**
   - User doesn't have access to requested entity
   - Solution: Verify entity ID and user permissions

4. **Rate limiting**
   - Too many API requests
   - Solution: Implement exponential backoff

## Future Enhancements

- [ ] Batch operations for multiple entities
- [ ] Webhook support for access change notifications
- [ ] Access audit trail UI
- [ ] Automated permission health checks
- [ ] Support for Google Workspace services
- [ ] Enhanced error recovery mechanisms
