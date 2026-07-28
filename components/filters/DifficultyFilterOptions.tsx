import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ACA_RISK_ORDER,
  ACA_TECHNICAL_ORDER,
  ACA_TIME_ORDER,
  ACA_WATER_ORDER,
  AcaDifficultyFilterOptions,
  AcaRiskSubRating,
  AcaTechnicalSubRating,
  AcaTimeSubRating,
  AcaWaterSubRating,
  DifficultyRatingSystem,
  RiskMinMax,
  TechnicalMinMax,
  TimeMinMax,
  WaterMinMax,
  type DifficultyFilterOptions as PersistedDifficultyOptions,
} from "ropegeo-common/models";
import { ConstantText } from "@/components/text/ConstantText";
import { ScalingText } from "@/components/text/ScalingText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { fullRangeAcaDifficultyFilterOptions } from "@/utils/filters/defaultAcaDifficultyFilterOptions";
import { DiscreteRangeSlider } from "@/components/sliders/DiscreteRangeSlider";
import {
  ACA_RISK_BADGES,
  ACA_RISK_THUMB_TITLES,
  ACA_TECHNICAL_BADGES,
  ACA_TECHNICAL_THUMB_TITLES,
  ACA_TIME_BADGES,
  ACA_TIME_THUMB_TITLES,
  ACA_WATER_BADGES,
  ACA_WATER_THUMB_TITLES,
} from "./acaDifficultyBadgeMaps";
import { useFilterTheme } from "@/utils/filters/useFilterTheme";


function orderedEnum<T extends string>(
  values: readonly T[],
  order: Record<T, number>,
): T[] {
  return [...values].sort((a, b) => order[a] - order[b]);
}

const ORDERED_TECHNICAL = orderedEnum(
  Object.values(AcaTechnicalSubRating),
  ACA_TECHNICAL_ORDER,
);
const ORDERED_WATER = orderedEnum(
  Object.values(AcaWaterSubRating),
  ACA_WATER_ORDER,
);
const ORDERED_TIME = orderedEnum(
  Object.values(AcaTimeSubRating),
  ACA_TIME_ORDER,
);
const ORDERED_RISK = orderedEnum(
  Object.values(AcaRiskSubRating),
  ACA_RISK_ORDER,
);

const DIFFICULTY_TYPES = Object.values(DifficultyRatingSystem) as DifficultyRatingSystem[];

const DIFFICULTY_TYPE_ICON_SIZE = 48;

const ACA_ICON = require("@/assets/images/icons/ACA.png");

const DIFFICULTY_ACA_LABEL = "American Canyoneering Association";

function difficultyTypeLabel(t: DifficultyRatingSystem): string {
  if (t === DifficultyRatingSystem.ACA) {
    return DIFFICULTY_ACA_LABEL;
  }
  return t;
}

export type DifficultyFilterOptionsProps = {
  options: PersistedDifficultyOptions | null;
  onChange: (next: PersistedDifficultyOptions | null) => void;
};

export function DifficultyFilterOptions({
  options,
  onChange,
}: DifficultyFilterOptionsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const {
    background,
    filter,
    sectionLabel,
    hintText,
    text,
  } = useFilterTheme();
  const { dropdown, noteText } = filter;
  const uiScale = useUiScale();
  const textStyle = useTextStyle();

  const selectedType: DifficultyRatingSystem | null = useMemo(() => {
    if (options == null) return null;
    return options.difficultyType;
  }, [options]);

  const acaOptions =
    options instanceof AcaDifficultyFilterOptions
      ? options
      : null;

  const dropdownSummary =
    selectedType == null ? "All" : difficultyTypeLabel(selectedType);

  const selectType = useCallback(
    (next: DifficultyRatingSystem | null) => {
      setPickerOpen(false);
      if (next == null) {
        onChange(null);
        return;
      }
      if (next === DifficultyRatingSystem.ACA) {
        if (acaOptions != null) {
          onChange(acaOptions);
        } else {
          onChange(fullRangeAcaDifficultyFilterOptions());
        }
      }
    },
    [onChange, acaOptions],
  );

  const patchAca = useCallback(
    (next: AcaDifficultyFilterOptions) => {
      onChange(next);
    },
    [onChange],
  );

  return (
    <View style={styles.section}>
      <ConstantText
        size={uiScale.filter.text.sectionTitle}
        typography={textStyle.filter.sectionTitle}
        style={[styles.sectionLabel, sectionLabel]}
      >
        Difficulty Rating System
      </ConstantText>
      <Pressable
        style={[
          styles.dropdownTrigger,
          {
            borderColor: dropdown.outline,
            backgroundColor: background,
          },
        ]}
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Difficulty rating system"
      >
        <View style={styles.dropdownTriggerMain}>
          <ScalingText
            size={uiScale.filter.buttons.checkbox.text!}
            typography={textStyle.filter.optionLabel}
            numberOfLines={2}
            measure={{ type: "lineCount", maxLinesAtMaxSize: 2 }}
            style={[styles.dropdownTriggerText, { color: text.primary }]}
            containerStyle={styles.dropdownTriggerText}
          >
            {dropdownSummary}
          </ScalingText>
          {selectedType === DifficultyRatingSystem.ACA ? (
            <Image
              source={ACA_ICON}
              style={styles.difficultyTypeIcon}
              contentFit="contain"
            />
          ) : null}
        </View>
        <ConstantText
          size={uiScale.filter.buttons.radio.subtext!}
          typography={textStyle.filter.optionSublabel}
          style={hintText}
        >
          ▼
        </ConstantText>
      </Pressable>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPickerOpen(false)}
          />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: dropdown.modalBackground },
            ]}
          >
            <ConstantText
              size={uiScale.filter.text.sectionTitle}
              typography={textStyle.filter.sectionTitle}
              style={[styles.modalTitle, { color: text.primary }]}
            >
              Difficulty Rating System
            </ConstantText>
            <ScrollView style={styles.modalList} keyboardShouldPersistTaps="handled">
              <Pressable
                style={styles.modalRow}
                onPress={() => selectType(null)}
              >
                <ConstantText
                  size={uiScale.filter.buttons.checkbox.text!}
                  typography={textStyle.filter.optionLabel}
                  style={{ color: text.primary }}
                >
                  All
                </ConstantText>
              </Pressable>
              {DIFFICULTY_TYPES.map((t) => (
                <Pressable
                  key={t}
                  style={styles.modalRow}
                  onPress={() => selectType(t)}
                >
                  <ConstantText
                    size={uiScale.filter.buttons.checkbox.text!}
                    typography={textStyle.filter.optionLabel}
                    style={[styles.modalRowText, { color: text.primary }]}
                  >
                    {difficultyTypeLabel(t)}
                  </ConstantText>
                  {t === DifficultyRatingSystem.ACA ? (
                    <Image
                      source={ACA_ICON}
                      style={styles.difficultyTypeIcon}
                      contentFit="contain"
                    />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {selectedType === DifficultyRatingSystem.ACA && acaOptions != null ? (
        <View style={styles.acaBlock}>
          <DiscreteRangeSlider
            label="Technical Rating"
            orderedValues={ORDERED_TECHNICAL}
            min={acaOptions.technical.min}
            max={acaOptions.technical.max}
            badges={ACA_TECHNICAL_BADGES}
            thumbTitles={ACA_TECHNICAL_THUMB_TITLES}
            onChange={(min, max) =>
              patchAca(
                new AcaDifficultyFilterOptions(
                  new TechnicalMinMax(min, max),
                  acaOptions.water,
                  acaOptions.time,
                  acaOptions.effectiveRisk,
                ),
              )
            }
          />
          <DiscreteRangeSlider
            label="Water Rating"
            orderedValues={ORDERED_WATER}
            min={acaOptions.water.min}
            max={acaOptions.water.max}
            badges={ACA_WATER_BADGES}
            thumbTitles={ACA_WATER_THUMB_TITLES}
            onChange={(min, max) =>
              patchAca(
                new AcaDifficultyFilterOptions(
                  acaOptions.technical,
                  new WaterMinMax(min, max),
                  acaOptions.time,
                  acaOptions.effectiveRisk,
                ),
              )
            }
          />
          <DiscreteRangeSlider
            label="Time Rating"
            orderedValues={ORDERED_TIME}
            min={acaOptions.time.min}
            max={acaOptions.time.max}
            badges={ACA_TIME_BADGES}
            thumbTitles={ACA_TIME_THUMB_TITLES}
            onChange={(min, max) =>
              patchAca(
                new AcaDifficultyFilterOptions(
                  acaOptions.technical,
                  acaOptions.water,
                  new TimeMinMax(min, max),
                  acaOptions.effectiveRisk,
                ),
              )
            }
          />
          <View>
            <DiscreteRangeSlider
              label="Effective Risk Rating"
              orderedValues={ORDERED_RISK}
              min={acaOptions.effectiveRisk.min}
              max={acaOptions.effectiveRisk.max}
              badges={ACA_RISK_BADGES}
              thumbTitles={ACA_RISK_THUMB_TITLES}
              onChange={(min, max) =>
                patchAca(
                  new AcaDifficultyFilterOptions(
                    acaOptions.technical,
                    acaOptions.water,
                    acaOptions.time,
                    new RiskMinMax(min, max),
                  ),
                )
              }
            />
            <ConstantText
              size={uiScale.filter.text.note}
              typography={textStyle.filter.note}
              style={[styles.effectiveRiskNote, { color: noteText }]}
            >
              The ACA rating system uses &quot;additional risk&quot; to denote elevated risk factors above the norm.
              &quot;Effective risk&quot; takes into account the technical rating
              and additional risk rating to reflect the true expected risk of a route.
            </ConstantText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownTriggerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  difficultyTypeIcon: {
    width: DIFFICULTY_TYPE_ICON_SIZE,
    height: DIFFICULTY_TYPE_ICON_SIZE,
  },
  dropdownTriggerText: {
    flex: 1,
  },
  dropdownChevron: {},
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
    position: "relative",
  },
  modalCard: {
    zIndex: 1,
    borderRadius: 14,
    maxHeight: "70%",
    paddingVertical: 12,
  },
  modalTitle: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalList: {
    maxHeight: 320,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  modalRowText: {
    flex: 1,
  },
  acaBlock: {
    marginTop: 20,
  },
  effectiveRiskNote: {
    marginTop: 6,
  },
});
