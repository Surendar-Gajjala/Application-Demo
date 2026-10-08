package com.demo.itemintegration.common.dto;

import java.util.List;

/**
 * One page of any entity as returned by the local API ({@code /api/items},
 * {@code /api/parts}, ...). {@code page} is zero-based; {@code count} is the number of
 * rows on this page. {@code totalItems} and {@code totalPages} are null when the hosted
 * server does not report a total.
 */
public record PageResponse<T>(
        int count,
        List<T> items,
        int page,
        int size,
        Long totalItems,
        Integer totalPages,
        boolean hasMore) {

    /** Largest page size the local API accepts. */
    public static final int MAX_SIZE = 100;

    public static <T> PageResponse<T> of(List<T> items, int page, int size, Long totalItems, Boolean hasMore) {
        Integer totalPages = totalItems == null ? null : (int) Math.max(1, (totalItems + size - 1) / size);
        boolean more = hasMore != null
                ? hasMore
                : totalItems != null ? (long) (page + 1) * size < totalItems : items.size() == size;
        return new PageResponse<>(items.size(), items, page, size, totalItems, totalPages, more);
    }
}
