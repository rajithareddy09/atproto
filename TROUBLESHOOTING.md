# Troubleshooting Guide

## Common Docker Build Issues

### 1. "failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory"

**Cause**: The Dockerfile is missing or the build context is incorrect.

**Solution**:
- Ensure all Dockerfiles exist in the correct locations:
  - `services/pds/Dockerfile` ✅ (exists)
  - `services/bsky/Dockerfile` ✅ (exists)
  - `services/ozone/Dockerfile` ✅ (exists)
  - `services/plc/Dockerfile` ✅ (created)

### 2. "Module not found" errors during build

**Cause**: Missing dependencies or incorrect package.json files.

**Solution**:
- Ensure all services have proper `package.json` files
- Check that the Dockerfile copies all necessary packages

### 3. Database connection errors

**Cause**: PostgreSQL not running or incorrect connection strings.

**Solution**:
- Verify PostgreSQL container is running: `docker-compose ps`
- Check database connection strings in environment files
- Ensure database setup script ran successfully

### 4. Port conflicts

**Cause**: Ports already in use by other services.

**Solution**:
- Check if ports are in use: `netstat -tulpn | grep :2582`
- Stop conflicting services or change ports in docker-compose.yml

## Quick Fix Commands

### Rebuild all services:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### View logs for specific service:
```bash
docker-compose logs pds
docker-compose logs bsky
docker-compose logs ozone
docker-compose logs plc
```

### Check service status:
```bash
docker-compose ps
```

### Reset everything:
```bash
docker-compose down -v
docker system prune -f
docker-compose up -d
```

## Environment File Issues

### Missing environment variables:
- Ensure all required environment variables are set
- Check that placeholder values are replaced with actual values
- Verify file paths are correct

### Database connection issues:
- Update database URLs to use `postgres` hostname (Docker service name)
- Ensure database credentials match those in `database-setup.sql`

## Network Issues

### DNS resolution:
- Ensure all domains resolve to your server IP
- Check DNS propagation with `nslookup pdsapi.sfproject.net`

### SSL certificate issues:
- Verify certificates are valid and properly configured
- Check certificate paths in web server configuration

## Performance Issues

### High memory usage:
- Monitor container resource usage: `docker stats`
- Consider increasing server resources
- Optimize database queries

### Slow startup:
- Check if all dependencies are properly cached
- Verify network connectivity
- Monitor disk I/O

## Getting Help

If you're still experiencing issues:

1. **Check the logs**: `docker-compose logs -f`
2. **Verify configuration**: Ensure all environment files are properly configured
3. **Test connectivity**: Try accessing services individually
4. **Check system resources**: Ensure sufficient CPU, memory, and disk space
5. **Review firewall settings**: Ensure required ports are open

## Common Error Messages and Solutions

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Check if service is running and port is accessible |
| `ENOTFOUND` | Verify DNS resolution and network connectivity |
| `EACCES` | Check file permissions and user access |
| `ENOSPC` | Free up disk space |
| `EMFILE` | Increase file descriptor limits |
