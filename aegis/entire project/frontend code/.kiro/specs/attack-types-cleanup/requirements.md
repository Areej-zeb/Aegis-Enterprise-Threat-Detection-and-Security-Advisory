# Requirements Document

## Introduction

This feature standardizes attack type definitions across the Aegis Dashboard frontend to ensure consistency, maintainability, and alignment with the backend detection capabilities. Currently, the frontend uses multiple inconsistent attack type values across different files (DDoS, SQLI, SSH_BRUTE_FORCE, ICMP_FLOOD, PORT_SCAN, etc.), leading to potential bugs and confusion. This cleanup will establish a single source of truth for attack types and remove all non-standard values.

## Glossary

- **Attack Type**: A classification label for network security threats detected by the IDS system
- **Frontend**: The React/TypeScript dashboard application located in the `aegis-dashboard` directory
- **Type Definition**: TypeScript type or interface that defines the structure and allowed values for data
- **Mock Data**: Simulated data used for testing and development when the backend is unavailable
- **Single Source of Truth**: A centralized, authoritative definition that all other code references

## Requirements

### Requirement 1

**User Story:** As a frontend developer, I want a single, centralized attack type definition, so that I can ensure consistency across all components and avoid type errors.

#### Acceptance Criteria

1. THE system SHALL define a TypeScript union type named `AttackType` with exactly four allowed values: "SYN_FLOOD", "MITM_ARP", "DNS_EXFILTRATION", and "BENIGN"
2. THE system SHALL export the `AttackType` definition from a centralized types file that can be imported throughout the application
3. THE system SHALL provide a constant array of all valid attack types for runtime operations such as random selection and validation
4. WHEN any component needs to reference attack types, THE system SHALL use the centralized `AttackType` definition
5. THE system SHALL ensure the `AttackType` definition is the only source of truth for attack type values in the frontend codebase

### Requirement 2

**User Story:** As a frontend developer, I want all TypeScript interfaces that reference attack types to use the standardized type, so that the type system prevents invalid attack type values.

#### Acceptance Criteria

1. WHEN the `Alert` interface is defined, THE system SHALL use the `AttackType` union type for the `attack_type` field
2. WHEN the `IDSAlert` interface is defined, THE system SHALL use the `AttackType` union type for the `attack_type` field
3. WHEN the `MockAlert` interface is defined, THE system SHALL use the `AttackType` union type for the `attack_type` field
4. WHEN the `DetectionResult` interface is defined, THE system SHALL use `AttackType | null` for the `attack_type` field to allow null values
5. THE system SHALL update all other interfaces that reference attack types to use the centralized `AttackType` definition

### Requirement 3

**User Story:** As a frontend developer, I want all mock data generators to produce only the four standardized attack types, so that development and testing use realistic, consistent data.

#### Acceptance Criteria

1. WHEN the mock IDS stream generator creates alerts, THE system SHALL select attack types only from the four standardized values
2. WHEN the mock data generator creates alerts, THE system SHALL select attack types only from the four standardized values
3. THE system SHALL remove all references to non-standard attack types from mock data arrays and constants
4. WHEN generating random attack types, THE system SHALL use only the standardized `AttackType` values
5. THE system SHALL ensure no mock data generation code contains hardcoded non-standard attack type strings

### Requirement 4

**User Story:** As a frontend developer, I want all conditional logic and mapping objects to handle only the four standardized attack types, so that the application behavior is predictable and maintainable.

#### Acceptance Criteria

1. WHEN switch statements evaluate attack types, THE system SHALL include cases only for the four standardized values plus a default case
2. WHEN if-else blocks check attack types, THE system SHALL compare against only the four standardized values
3. WHEN mapping objects translate attack types, THE system SHALL include keys only for the four standardized values
4. THE system SHALL remove all conditional branches that handle non-standard attack type values
5. WHEN filtering or grouping by attack type, THE system SHALL recognize only the four standardized values

### Requirement 5

**User Story:** As a frontend developer, I want all display logic and UI components to render only the four standardized attack types, so that users see consistent threat classifications.

#### Acceptance Criteria

1. WHEN attack type labels are displayed in charts, THE system SHALL show only the four standardized attack type names
2. WHEN attack type filters are rendered, THE system SHALL provide options only for the four standardized values
3. WHEN attack type badges or pills are displayed, THE system SHALL handle only the four standardized values
4. THE system SHALL remove all UI code that references non-standard attack type values
5. WHEN attack type names are formatted for display, THE system SHALL convert underscores to spaces and apply proper capitalization

### Requirement 6

**User Story:** As a frontend developer, I want comprehensive verification that no non-standard attack types remain in the codebase, so that I can be confident the cleanup is complete.

#### Acceptance Criteria

1. THE system SHALL contain no string literals matching non-standard attack type patterns in TypeScript and JavaScript files
2. THE system SHALL contain no array or object definitions that include non-standard attack type values
3. THE system SHALL contain no comments or documentation that reference non-standard attack types as valid values
4. WHEN searching the frontend codebase for attack type references, THE system SHALL find only the four standardized values
5. THE system SHALL maintain backward compatibility with backend responses that may contain different attack type values by mapping or filtering them appropriately
