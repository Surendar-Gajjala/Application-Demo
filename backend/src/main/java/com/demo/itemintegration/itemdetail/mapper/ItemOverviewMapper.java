package com.demo.itemintegration.itemdetail.mapper;

import static com.demo.itemintegration.common.mapping.ExternalValues.list;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import org.springframework.stereotype.Component;

import com.demo.itemintegration.common.mapping.CodeLabels;
import com.demo.itemintegration.common.mapping.ExternalValues;
import com.demo.itemintegration.external.dto.ExternalObjectResponse;
import com.demo.itemintegration.itemdetail.dto.ItemOverviewDto;
import com.demo.itemintegration.itemdetail.dto.ItemOverviewDto.Field;
import com.demo.itemintegration.itemdetail.dto.ItemOverviewDto.Section;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Maps the hosted partial-object response of an item to the Overview tab. The field
 * table below is the only place that knows the external property names; properties
 * not listed are not exposed.
 */
@Component
public class ItemOverviewMapper {

    /** How a raw value becomes display text. */
    private enum Kind {
        TEXT(ExternalValues::text),
        CODE(CodeLabels::label),
        BOOL(node -> {
            Boolean value = ExternalValues.toBoolean(node);
            return value == null ? null : value ? "Yes" : "No";
        }),
        CODES(node -> {
            List<String> labels = list(node, element -> CodeLabels.label(element));
            return labels.isEmpty() ? null : String.join(", ", labels);
        });

        private final Function<JsonNode, String> format;

        Kind(Function<JsonNode, String> format) {
            this.format = format;
        }
    }

    private record Spec(String external, String label, Kind kind, String reasonExternal) {
        static Spec of(String external, String label, Kind kind) {
            return new Spec(external, label, kind, null);
        }
    }

    private record SectionSpec(String title, List<Spec> fields) {
    }

    private static final List<SectionSpec> SECTIONS = List.of(
            new SectionSpec("General", List.of(
                    Spec.of("item_number", "Item Number", Kind.TEXT),
                    Spec.of("description", "Description", Kind.TEXT),
                    Spec.of("revision", "Revision", Kind.TEXT),
                    Spec.of("item_type", "Item Type", Kind.TEXT),
                    Spec.of("item_status", "Item Status", Kind.CODE),
                    Spec.of("make_buy", "Make / Buy", Kind.TEXT),
                    Spec.of("design_group", "Design Group", Kind.TEXT),
                    Spec.of("project", "Project", Kind.TEXT),
                    Spec.of("business_unit", "Business Unit", Kind.TEXT),
                    Spec.of("structure_role", "Structure", Kind.CODE),
                    Spec.of("is_product", "Product", Kind.BOOL),
                    Spec.of("restricted", "Restricted", Kind.BOOL),
                    Spec.of("exemption_status", "Exemption Status", Kind.CODE),
                    Spec.of("item_sourcing_status", "Item Sourcing Status", Kind.CODE),
                    Spec.of("ec_roll_indicator", "EC Roll Indicator", Kind.TEXT),
                    Spec.of("aec_grade_number", "AEC Grade", Kind.TEXT),
                    Spec.of("ppap_support_indicator", "PPAP Support", Kind.TEXT))),
            new SectionSpec("Risk", List.of(
                    new Spec("availability_risk", "Availability Risk", Kind.CODE, "availability_risk_reason"),
                    new Spec("supply_chain_risk", "Supply Chain Risk", Kind.CODE, "supply_chain_risk_reason"),
                    new Spec("lifecycle.risk", "Lifecycle Risk", Kind.CODE, "lifecycle.risk_reason"),
                    new Spec("cost_risk", "Cost Risk", Kind.CODE, "cost_risk_reason"),
                    new Spec("quality_risk", "Quality Risk", Kind.CODE, "quality_risk_reason"),
                    new Spec("technology_risk", "Technology Risk", Kind.CODE, "technology_risk_reason"),
                    new Spec("environmental_compliance_risk", "Environmental Compliance Risk", Kind.CODE,
                            "environmental_compliance_risk_reason"))),
            new SectionSpec("Lifecycle", List.of(
                    Spec.of("lifecycle.sourcing_status", "Sourcing Status", Kind.CODE),
                    Spec.of("lifecycle.sole_source_reason", "Sole Source Reason", Kind.TEXT),
                    Spec.of("lifecycle.forecast_yteol_min", "Forecast Years to EOL (min)", Kind.TEXT),
                    Spec.of("lifecycle.forecast_yteol_max", "Forecast Years to EOL (max)", Kind.TEXT),
                    Spec.of("lifecycle_metadata.total_sources", "Total Sources", Kind.TEXT),
                    Spec.of("lifecycle_metadata.active_sources", "Active Sources", Kind.TEXT),
                    Spec.of("lifecycle_metadata.viable_sources", "Viable Sources", Kind.TEXT),
                    Spec.of("lifecycle_metadata.nrnd_sources", "NRND Sources", Kind.TEXT),
                    Spec.of("lifecycle_metadata.ltb_sources", "Last Time Buy Sources", Kind.TEXT),
                    Spec.of("lifecycle_metadata.obsolete_sources", "Obsolete Sources", Kind.TEXT),
                    Spec.of("lifecycle_metadata.unknown_sources", "Unknown Sources", Kind.TEXT),
                    Spec.of("lifecycle_metadata.aml_disqualified_sources", "AML Disqualified Sources", Kind.TEXT),
                    Spec.of("lifecycle_metadata.viable_manufacturers", "Viable Manufacturers", Kind.TEXT))),
            new SectionSpec("Environmental Compliance", List.of(
                    Spec.of("environmental_compliance.eu_rohs", "EU RoHS", Kind.CODE),
                    Spec.of("environmental_compliance.eu_rohs_lock", "EU RoHS Lock", Kind.CODE),
                    Spec.of("environmental_compliance.ec_exemptions", "EC Exemptions", Kind.CODES),
                    Spec.of("environmental_compliance.pwb_lead_halogen", "PWB Lead / Halogen", Kind.CODE),
                    Spec.of("environmental_compliance.pwb_lead_halogen_lock", "PWB Lead / Halogen Lock", Kind.CODE),
                    Spec.of("environmental_compliance.plastic_lead_halogen", "Plastic Lead / Halogen", Kind.CODE),
                    Spec.of("environmental_compliance.plastic_lead_halogen_lock", "Plastic Lead / Halogen Lock", Kind.CODE),
                    Spec.of("environmental_compliance.pnr", "PNR", Kind.CODE),
                    Spec.of("environmental_compliance.pnr_lock", "PNR Lock", Kind.CODE),
                    Spec.of("environmental_compliance.collection", "Collection", Kind.CODE),
                    Spec.of("environmental_compliance.collection_lock", "Collection Lock", Kind.CODE))),
            new SectionSpec("Usage & Impact", List.of(
                    Spec.of("used_in_products", "Used In Products", Kind.TEXT),
                    Spec.of("where_used_count", "Where Used Count", Kind.TEXT),
                    Spec.of("bom_line_count", "BOM Line Count", Kind.TEXT),
                    Spec.of("products_impacted", "Products Impacted", Kind.TEXT),
                    Spec.of("product_families_impacted", "Product Families Impacted", Kind.TEXT),
                    Spec.of("business_units_impacted", "Business Units Impacted", Kind.TEXT),
                    Spec.of("manufacturers_impacted", "Manufacturers Impacted", Kind.TEXT),
                    Spec.of("preferred_manufacturers_impacted", "Preferred Manufacturers Impacted", Kind.TEXT),
                    Spec.of("manufacturer_parts_impacted", "Manufacturer Parts Impacted", Kind.TEXT))),
            new SectionSpec("Notes", List.of(
                    Spec.of("comments", "Comments", Kind.TEXT),
                    Spec.of("source_notes", "Source Notes", Kind.TEXT),
                    Spec.of("material_comments", "Material Comments", Kind.TEXT))));

    public ItemOverviewDto toOverview(ExternalObjectResponse object) {
        List<Section> sections = new ArrayList<>(SECTIONS.size());
        for (SectionSpec section : SECTIONS) {
            List<Field> fields = new ArrayList<>(section.fields().size());
            for (Spec spec : section.fields()) {
                String reason = spec.reasonExternal() == null ? null : ExternalValues.text(object.value(spec.reasonExternal()));
                fields.add(new Field(spec.label(), spec.kind().format.apply(object.value(spec.external())), reason));
            }
            sections.add(new Section(section.title(), fields));
        }
        return new ItemOverviewDto(
                object.objectId(),
                ExternalValues.text(object.value("item_number")),
                ExternalValues.text(object.value("description")),
                ExternalValues.text(object.value("revision")),
                ExternalValues.text(object.value("item_type")),
                CodeLabels.label(object.value("item_status")),
                sections);
    }
}
