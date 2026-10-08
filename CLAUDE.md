# External Item Data Integration — Requirements & Instructions

## 1. Objective

Build a Spring Boot application that retrieves Item data from an external hosted server and exposes the data through a local REST API.

The application acts as an integration layer between the external hosted data environment and the local frontend.

---

## 2. Core Requirements

- Item data comes from an external hosted server.
- The local application must not use a database for Item data.
- Item data must not be persisted locally.
- The application should retrieve the required Item data from the hosted server through one API call.
- The hosted server requires Bearer Token authentication.
- The external API URL must be configurable.
- The Bearer Token must be configurable.
- API URL and Bearer Token must be provided through environment variables.
- The Bearer Token must never be hard-coded.
- The Bearer Token must never be exposed to the frontend.
- The external API response must be mapped into the application's internal Item data model.
- The frontend should communicate only with the local application API.
- The frontend should not directly call the hosted server.
- External API-specific field names should be isolated from the internal application model.

---

# 3. Application Context

The application has its own Item data model.

The actual Item data, however, is maintained by an external hosted data environment.

The local application does not own or persist this data.

Instead, whenever Item data is requested:

1. The frontend calls the local Item API.
2. The local application calls the hosted server.
3. The hosted server returns the Item data.
4. The local application maps the external response.
5. The local application returns the mapped Item data to the frontend.

The application therefore behaves as a **read-only data integration layer**.

---

# 4. Data Ownership

### External Hosted Server

The hosted server is the source of truth for Item data.

It owns:

- Item information
- Item identifiers
- Item descriptions
- Item revisions
- Business units
- Product information
- Structure roles
- ODM information
- Availability risk
- Product usage
- Product family impact
- Item status

### Local Application

The local application is responsible for:

- Calling the hosted API
- Authenticating with the hosted API
- Receiving the external response
- Mapping external fields
- Providing a clean local API
- Returning data to the frontend

The local application does **not** own the underlying Item data.

---

# 5. No Database Requirement

There must be no database dependency for retrieving Item data.

The application must not:

- Save Items into PostgreSQL
- Save Items into MySQL
- Create Item database tables
- Insert Item records
- Update Item records
- Delete Item records
- Use a repository for Item persistence
- Use JPA/Hibernate for Item persistence

The data should remain in the hosted environment.

---

# 6. High-Level Architecture

```text
Frontend
    |
    | GET /api/items
    |
    v
Item Controller
    |
    v
Item Service
    |
    v
External API Client
    |
    | One authenticated API call
    |
    v
Hosted Server
    |
    | Item data
    |
    v
External Response
    |
    v
Mapper
    |
    v
Internal Item Model
    |
    v
Item Response
    |
    v
Frontend
```

The architecture must remain simple:

**Frontend → Local API → External API → Mapping → Local API Response**

---

# 7. Central External API Configuration

Create one centralized configuration area for the hosted server connection.

The configuration must contain:

- External API URL
- Bearer Token
- Any required external API settings

The configuration should be used by the external API client.

The application must not spread the external URL or authentication token across multiple classes.

---

# 8. Environment Configuration

The following information must come from environment variables:

### External API URL

The URL of the hosted Item data API.

### Bearer Token

The authentication token required to access the hosted server.

The token must be treated as a secret.

### Security instructions

- Never hard-code the token.
- Never commit the token to Git.
- Never return the token in an API response.
- Never display the token in application logs.
- Never send the token to the frontend.
- Keep environment-specific configuration outside application source code.

---

# 9. Required Application Components

The application should contain the following logical components:

### Item Model

Represents the application's internal Item structure.

### Item DTO

Represents the data exposed by the local application API.

### External Response DTO

Represents the response received from the hosted server.

This DTO should contain the external API response structure.

### Item Mapper

Responsible for converting external Item data into the application's internal Item representation.

### External API Client

Responsible only for communicating with the hosted server.

### Item Service

Responsible for coordinating the external data retrieval and mapping process.

### Item Controller

Responsible for exposing the local Item REST API.

### External API Configuration

Responsible for managing the hosted server URL and authentication configuration.

---

# 10. Item Data Model

The internal Item model must contain the following business fields:

| Field | Type | Description |
|---|---|---|
| itemNumber | Text | Item number |
| description | Text | Item description |
| revision | Text | Item revision |
| businessUnit | Text | Business unit |
| isProduct | Boolean | Indicates whether the Item is a product |
| structureRole | List of Values | ITEM or BOM |
| odmName | Text/List | ODM name information |
| odmActive | Boolean/List | ODM active information |
| availabilityRisk | List of Values | LOW, MEDIUM, HIGH, NOT ASSESSED |
| usedInProducts | Text | Products where the Item is used |
| productFamiliesImpacted | Number | Number of impacted product families |
| itemStatusName | Text | Item status |
| id | Integer/Long | Item identifier |

---

# 11. Structure Role

The Item structure role has two possible values:

- ITEM
- BOM

This represents the role of the Item within the product structure.

The external value must be converted into the application's internal representation.

---

# 12. Availability Risk

Availability risk has the following allowed values:

- LOW
- MEDIUM
- HIGH
- NOT ASSESSED

The external API may provide the value in uppercase format.

The application must normalize the external value into the internal representation.

---

# 13. External Data Fields

The hosted API provides the following fields:

| External Field | Internal Field |
|---|---|
| item_number | itemNumber |
| description | description |
| item__revision | revision |
| item__business_unit | businessUnit |
| item__is_product | isProduct |
| item__structure_role | structureRole |
| item__odm__name | odmName |
| item__odm__active | odmActive |
| item__availability_risk | availabilityRisk |
| item__used_in_products | usedInProducts |
| item__product_families_impacted | productFamiliesImpacted |
| item__item_status__name | itemStatusName |
| item__id | id |

The external field names must not become the application's internal business naming convention.

For example:

**External:**

`item__business_unit`

**Internal:**

`businessUnit`

---

# 14. External Response Context

The hosted server response contains multiple sections.

### Query Information

The response may contain the ZQL query used by the hosted server.

This is external-system metadata.

The local Item model does not need to expose the ZQL query.

### Properties

The response may contain the list of returned property names.

This describes the external response structure.

The local application should use it only as required for external response processing.

### Objects

The response may contain metadata describing the external object.

This is external-system metadata and does not need to become part of the internal Item model.

### Results

The results section contains the actual Item records.

The application must map the records from this section into the internal Item model.

---

# 15. Single API Call Requirement

The application must retrieve the Item dataset using one external API request.

The expected behavior is:

```text
Local Item Request
       |
       v
One External API Call
       |
       v
External Response
       |
       v
Multiple Item Results
       |
       v
Local Mapping
```

The application must not make a separate external API call for every Item.

For example, if the hosted server returns 10,000 Items:

- External API calls = 1
- Items received = 10,000
- Mapping operations = 10,000 locally

---

# 16. Mapping Responsibility

The mapper is an important boundary between the external system and the local application.

Its responsibility is to:

- Read external field names.
- Convert external values.
- Normalize enums.
- Normalize empty values.
- Convert external identifiers.
- Convert ODM information.
- Create the internal Item representation.
- Create the local API response representation if required.

The controller must not contain mapping logic.

The service must not contain detailed field-by-field mapping logic.

Mapping should be centralized in the mapper.

---

# 17. ODM Data Handling

The external API currently provides ODM values such as:

- ODM name as an array-like value.
- ODM active as an array-like value.

Example external values:

`[]`

These values need to be normalized before being exposed through the local API.

The implementation must confirm the complete ODM response format from the real hosted API.

The mapping design must support:

- Empty ODM values
- One ODM value
- Multiple ODM values
- Missing ODM values

The final internal type should be selected based on the actual external API contract.

---

# 18. Empty and Null Values

The external system may return:

- Null
- Empty string
- Empty array
- Missing field

The application must handle these values safely.

A missing or empty value must not cause the entire Item retrieval operation to fail.

The normalization rules should be consistent across all Item records.

---

# 19. Service Responsibility

The Item service coordinates the complete business flow.

The service should:

1. Request the Item data from the external API client.
2. Receive the external response.
3. Extract the Item result records.
4. Pass each record to the mapper.
5. Build the local response.
6. Return the result to the controller.

The service must not:

- Directly construct HTTP requests.
- Contain the Bearer Token.
- Contain the external URL.
- Contain large amounts of field mapping logic.
- Save Items to a database.

---

# 20. External API Client Responsibility

The external API client is responsible for communication with the hosted server.

It should:

- Read the centralized external configuration.
- Build the external request.
- Add the Bearer Token.
- Call the hosted API.
- Receive the response.
- Convert the response into the external response DTO.
- Handle external communication errors.

The client should not contain business mapping logic.

---

# 21. Controller Responsibility

The Item controller exposes the local REST endpoint.

The frontend should call the local endpoint to retrieve Items.

Example logical endpoint:

```text
GET /api/items
```

The controller should:

1. Receive the frontend request.
2. Call the Item service.
3. Receive the mapped Item response.
4. Return the response to the frontend.

The controller should not know:

- The external server URL
- The Bearer Token
- The ZQL query
- External field names
- External response structure

---

# 22. Frontend Responsibility

The frontend communicates only with the local application.

The frontend should not directly communicate with the hosted server.

Expected flow:

```text
Frontend
    |
    | GET /api/items
    v
Local Spring Boot Application
    |
    v
Hosted Server
```

The frontend receives a clean Item structure using internal field names.

---

# 23. API Response Contract

The local API should expose clean application-level fields.

The response should contain:

- id
- itemNumber
- description
- revision
- businessUnit
- isProduct
- structureRole
- odmName
- odmActive
- availabilityRisk
- usedInProducts
- productFamiliesImpacted
- itemStatusName

The local API should not expose unnecessary external-system metadata such as:

- ZQL
- External object metadata
- External property metadata

unless specifically required by the frontend.

---

# 24. Error Handling Requirements

The application must handle external API failures.

### Unauthorized

If the Bearer Token is invalid or expired, the application must handle the unauthorized response appropriately.

### Forbidden

If the hosted server rejects access, return an appropriate error to the local client.

### Not Found

If the configured external endpoint is unavailable, return an appropriate error.

### Rate Limiting

If the hosted server returns a rate-limit response, the application must handle it appropriately.

### Server Error

External server failures must be handled without exposing internal implementation details.

### Timeout

Network timeout and connection failures must be handled gracefully.

The Bearer Token must never appear in error messages.

---

# 25. Security Requirements

The hosted server authentication information is sensitive.

The application must:

- Store the token only in environment configuration.
- Protect the token from source control.
- Protect the token from logs.
- Protect the token from API responses.
- Protect the token from frontend access.
- Avoid exposing the external authentication mechanism unnecessarily.

---

# 26. Performance Requirements

The application should optimize for the following flow:

```text
One external request
        ↓
Complete external response
        ↓
Local in-memory mapping
        ↓
Local API response
```

No repeated external calls should be generated during mapping.

The mapper must work on the already retrieved response.

---

# 27. Separation of Responsibilities

The design should maintain clear separation:

### Configuration

Knows:

- External URL
- Authentication configuration

### Client

Knows:

- How to call the external API

### External DTO

Knows:

- External response structure

### Mapper

Knows:

- How to translate external fields into internal fields

### Model

Knows:

- Internal Item business structure

### Service

Knows:

- Application flow

### Controller

Knows:

- Local API contract

### Frontend

Knows:

- Local API response

---

# 28. Complete Data Flow

```text
                 ENVIRONMENT
                     |
          External API URL
          Bearer Token
                     |
                     v
          Central Configuration
                     |
                     v
          External API Client
                     |
                     | ONE API CALL
                     v
           Hosted Data Environment
                     |
                     | Item Response
                     v
         External Response Structure
                     |
                     v
             External DTO
                     |
                     v
                Mapper
                     |
                     v
              Item Model
                     |
                     v
             Item Service
                     |
                     v
            Item Controller
                     |
                     v
              Local REST API
                     |
                     v
                 Frontend
```

---

# 29. Main Implementation Principle

The most important design principle is:

**The hosted server is the source of truth, while the local application is a read-only integration and presentation layer.**

The local application retrieves the data, transforms it into its own model, and exposes it through its own API.

No Item data is persisted locally.

---

# 30. Expected Result

After implementation, the application should provide the following behavior:

1. Application starts.
2. External API configuration is loaded from environment variables.
3. Frontend requests Item data.
4. Local Item controller receives the request.
5. Item service starts the retrieval process.
6. External API client sends one authenticated request.
7. Hosted server returns the Item dataset.
8. External response is converted into the external DTO.
9. Mapper converts external fields into the internal Item model.
10. Service prepares the local response.
11. Controller returns the clean Item data.
12. Frontend displays the Item information.
13. No Item data is saved in a local database.

---

# 31. Future Extensibility

The same architecture should be reusable for other external entities such as:

- Parts
- Sites
- BOM
- Suppliers
- Relationships
- Compliance data
- Risk data

For example:

```text
External Hosted Server
        |
        +---- Item API
        |
        +---- Part API
        |
        +---- Site API
        |
        +---- BOM API
        |
        +---- Supplier API
```

Each domain can have its own:

- External DTO
- Model
- Mapper
- Service
- Controller

while sharing the centralized external API configuration and client infrastructure where appropriate.

---

# 32. Final Requirement

Build the Item integration as a **database-free, read-only external data integration service**.

The final architecture must follow:

**Hosted Data → One API Call → External DTO → Mapper → Internal Item Model → Service → Controller → Frontend**

The implementation must keep external API details isolated, use environment-based authentication, avoid local persistence, and provide a clean internal Item API contract.