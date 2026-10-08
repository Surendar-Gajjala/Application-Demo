# Item Integration

Read-only, database-free Spring Boot service that fetches Item data from the hosted server in **one** authenticated call, maps it to the internal Item model, and serves it at `GET /api/items`. Requirements: [CLAUDE.md](../CLAUDE.md).

## Run

Requires JDK 17+ and Maven. From this `backend/` folder, either put the values in `backend/.env` (git-ignored, see [.env.example](.env.example)) or export them:

```bash
export EXTERNAL_API_URL="https://<hosted-server>/<items-endpoint>"   # already URL-encoded
export EXTERNAL_API_TOKEN="<bearer token>"                          # secret, never commit
mvn spring-boot:run
```

Call `GET http://localhost:8080/api/items`, or run the [frontend](../frontend) for the UI. `.env` is read from the working directory, so start the app from `backend/`.

`EXTERNAL_API_GRAPH_URL` (required) is the hosted graph-match endpoint (Item Hierarchy and item Sources); `EXTERNAL_API_OBJECT_URL` (required) is the single-object endpoint (item Overview). Both use the same token.

Optional: `EXTERNAL_API_CONNECT_TIMEOUT` (default `5s`), `EXTERNAL_API_READ_TIMEOUT` (default `30s`), `SERVER_PORT` (default `8080`). The app will not start if the URL or token is missing.

## Layout

Every entity uses the same `EXTERNAL_API_URL` and token; only the query-config payload differs (`src/main/resources/external-queries/<entity>-query.json`, registered in `external.ExternalQuery`).

| Layer | Shared | Items (`GET /api/items`) | Parts (`GET /api/parts`) | Sites (`GET /api/sites`) |
|---|---|---|---|---|
| Configuration | `config.ExternalApiProperties`, `config.ExternalApiClientConfig` | | | |
| External client | `external.ExternalApiClient`, `external.ExternalQuery` | `item-query.json` | `part-query.json` | `site-query.json` |
| External DTOs | `external.dto.ExternalQueryResponse` | `ExternalItemRecord` | `ExternalPartRecord` | `ExternalSiteRecord` |
| Mapper | `common.mapping.ExternalValues` | `item.mapper.ItemMapper` | `part.mapper.PartMapper` | `site.mapper.SiteMapper` |
| Model / DTO | `common.dto.PageResponse` | `item.model.Item`, `item.dto.ItemDto` | `part.model.Part`, `part.dto.PartDto` | `site.model.Site`, `site.dto.SiteDto` |
| Service | | `item.service.ItemService` | `part.service.PartService` | `site.service.SiteService` |
| Controller | | `item.controller.ItemController` | `part.controller.PartController` | `site.controller.SiteController` |
| Errors | `common.error.GlobalExceptionHandler` | | | |

## Item Hierarchy (`GET /api/item-hierarchy?page=&size=`)

One page of top-level products (`item_bom` roots), each with its full tree: BOM child items (`item_bom`, many-to-many, `qty` on the edge) and sourced parts (`item_sources`, one-to-many). Each page makes **two** hosted calls: the anchors query (`item-hierarchy-anchors.json`, which holds the scope id) and one graph traversal for all anchors (`item-hierarchy-graph.json`, max depth 6). `hierarchy.mapper.HierarchyTreeBuilder` turns the flat nodes/edges into nested `HierarchyNodeDto`s; a shared item is repeated under every parent with its own qty, and each occurrence has a unique `key` (path of node ids). Status-like codes become readable labels via `common.mapping.CodeLabels` (unknown codes pass through). Responses are gzip-compressed.

## Item details (`GET /api/items/{id}/overview | sources`)

One hosted call per tab, made only when that tab is opened:

| Tab | Endpoint | Hosted call |
|---|---|---|
| Overview | `/api/items/{id}/overview` | `GET ${EXTERNAL_API_OBJECT_URL}/{id}`: all properties, grouped into sections by `itemdetail.mapper.ItemOverviewMapper` (risk fields carry their reason) |
| Sources | `/api/items/{id}/sources` | graph match `item-sources-graph.json` (item_sources, descendants, anchored on the id), returned as `PartDto`s |

The hosted object endpoint answers an unknown id with an empty 200; that, or an id belonging to another entity, returns 404 `ITEM_NOT_FOUND`.

To add another entity: add `<entity>-query.json` and an `ExternalQuery` constant, then an external record DTO, model, DTO, mapper, service and controller following Parts.

## Response

`GET /api/items?page=0&size=25` returns one page. `page` is zero-based (default `0`); `size` is 1–100 (default `25`). Each request makes exactly one paged call to the hosted server; `page`/`size` in `EXTERNAL_API_URL` are overridden.

```json
{
  "page": 0, "size": 25, "totalItems": 5631, "totalPages": 226, "hasMore": true,
  "count": 1,
  "items": [{
    "id": 42, "itemNumber": "ITM-001", "description": "Widget", "revision": "B",
    "businessUnit": "Hardware", "isProduct": true, "structureRole": "BOM",
    "odmName": ["Acme"], "odmActive": [true], "availabilityRisk": "NOT ASSESSED",
    "usedInProducts": "P1, P2", "productFamiliesImpacted": 3, "itemStatusName": "Released"
  }]
}
```

## Upstream errors

| Hosted server | Local response |
|---|---|
| 401 / 403 | 502 `ITEM_SOURCE_ACCESS_DENIED` |
| 404 | 502 `ITEM_SOURCE_NOT_FOUND` |
| 429 | 429 `ITEM_SOURCE_RATE_LIMITED` (+ `Retry-After`) |
| 5xx / other 4xx | 502 `ITEM_SOURCE_ERROR` |
| Unreadable body | 502 `ITEM_SOURCE_INVALID_RESPONSE` |
| Timeout | 504 `ITEM_SOURCE_TIMEOUT` |
| Connection failure | 503 `ITEM_SOURCE_UNAVAILABLE` |

## To confirm against the real hosted API

- **Request:** the client sends one `POST` to `EXTERNAL_API_URL` with the query in [item-query.json](src/main/resources/external-queries/item-query.json) (`output.format: table`). Each `select[].alias` must match a `@JsonProperty` name in `ExternalItemRecord`.
- **Result row shape:** both object rows (`{"item_number": ...}`) and positional rows (arrays whose columns are named by `properties`) are supported.
- **ODM fields:** exposed as lists (`odmName: string[]`, `odmActive: boolean[]`), accepting `[]`, `"[]"`, a single value, or many values. Narrow the type once the real format is confirmed.
