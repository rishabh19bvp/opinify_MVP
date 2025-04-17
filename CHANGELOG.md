# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### 1.0.1 (2025-04-17)

## [0.3.0] - 2025-04-12
### Added
- Geospatial polling system with location-based discovery
- Poll model with MongoDB geospatial indexing
- Location-based poll filtering and distance calculations
- Poll voting mechanism with duplicate vote prevention
- Poll expiration handling and status management
- Comprehensive test suite for the Poll model
- Robust error handling for geospatial operations

### Changed
- Enhanced MongoDB indexing for improved geospatial query performance
- Improved test infrastructure for handling geospatial indexes
- Updated test suite to handle concurrent test execution

### Fixed
- Resolved issues with geospatial index creation in test environment
- Fixed MongoDB connection handling in test suites

## [0.2.0] - 2025-04-12
### Added
- User authentication system with registration and login
- Password hashing and verification using bcrypt
- JWT token-based authentication
- User profile management
- Location-based user validation
- Comprehensive test suite for authentication
- Custom error handling for authentication
- TypeScript interfaces for user and authentication

### Changed
- Updated MongoDB schema for user model
- Improved error handling in services
- Enhanced test coverage for authentication

## [0.1.0] - 2025-04-12
### Added
- Initial project setup with frontend and backend structure
- TypeScript configuration for both projects
- Basic Express.js server setup
- MongoDB connection configuration
- Initial project documentation

### Changed
- Updated all npm dependencies to their latest versions
- Configured automated changelog generation

### Fixed
- Resolved dependency conflicts and deprecation warnings

## [0.0.1] - 2025-04-12
### Added
- Initial project structure
- Basic configuration files

[Unreleased]: https://github.com/yourusername/opinify/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/yourusername/opinify/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/yourusername/opinify/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/yourusername/opinify/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/yourusername/opinify/releases/tag/v0.0.1
