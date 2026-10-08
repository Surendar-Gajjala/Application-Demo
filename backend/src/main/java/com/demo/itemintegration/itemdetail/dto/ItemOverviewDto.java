package com.demo.itemintegration.itemdetail.dto;

import java.util.List;

/**
 * Overview tab of the item details view: the identifying fields for the page header,
 * then every shown property grouped into labelled sections. Values are display-ready
 * (codes become readable labels, booleans Yes/No); {@code null} means no value.
 */
public record ItemOverviewDto(
        Long id,
        String itemNumber,
        String description,
        String revision,
        String itemType,
        String itemStatus,
        List<Section> sections) {

    public record Section(String title, List<Field> fields) {
    }

    /** {@code reason} explains a calculated value (e.g. why a risk is "Not Assessed"). */
    public record Field(String label, String value, String reason) {
    }
}
