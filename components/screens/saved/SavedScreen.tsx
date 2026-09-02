import { SearchBar } from "@/components/search/SearchBar";
import { FilterBottomSheet } from "@/components/modals/FilterBottomSheet";
import { FilterButton } from "@/components/buttons/standard/FilterButton";
import { PagePreview } from "@/components/previews/PagePreview";
import { TOAST_KEY_NETWORK_OFFLINE } from "@/constants/toasts/toastArchetypes";
import { useColorTheme } from "@/context/theme/ColorThemeContext";
import { useSavedFilters } from "@/context/data/SavedFiltersContext";
import { useSavedPages } from "@/context/data/SavedPagesContext";
import { useToast } from "@/context/ui/ToastContext";
import { applySavedPagesFilter } from "@/utils/savedPages/savedPagesFilterPipeline";
import { ConstantText } from "@/components/text/ConstantText";
import { useTextStyle } from "@/context/typography/TextContext";
import { useUiScale } from "@/context/typography/UIScaleContext";
import { usePreviewTextMetrics } from "@/utils/layout/previewLayout";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SavedPagesFilter } from "ropegeo-common/models";
import { useHeaderChromeLayout, useSearchChromeStackedLayout } from "@/utils/layout/buttonChromeLayout";

export function SavedScreen() {
  const { background, text } = useColorTheme();
  const uiScale = useUiScale();
  const textStyle = useTextStyle();
  const previewMetrics = usePreviewTextMetrics();
  const insets = useSafeAreaInsets();
  const { dismiss } = useToast();
  const { savedEntries } = useSavedPages();
  const {
    getEffectiveSavedPagesFilter,
    savedPagesPersisted,
    persistSavedPagesFilter,
    revision,
  } = useSavedFilters();
  const [nameInput, setNameInput] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [savedDraft, setSavedDraft] = useState<SavedPagesFilter | null>(null);

  const persistedSavedFilter = useMemo(() => {
    return SavedPagesFilter.fromJsonString(
      getEffectiveSavedPagesFilter().toString(),
    );
  }, [getEffectiveSavedPagesFilter, revision]);

  const filtered = useMemo(
    () =>
      applySavedPagesFilter(
        savedEntries,
        persistedSavedFilter,
        nameInput.trim() === "" ? null : nameInput.trim(),
      ),
    [savedEntries, persistedSavedFilter, nameInput],
  );

  const headerChrome = useHeaderChromeLayout();
  const searchChrome = useSearchChromeStackedLayout();
  const searchBarTop = insets.top + searchChrome.rowTop;

  useFocusEffect(
    useCallback(() => {
      dismiss(TOAST_KEY_NETWORK_OFFLINE);
    }, [dismiss]),
  );

  const openFilterSheet = () => {
    const d = SavedPagesFilter.fromJsonString(
      getEffectiveSavedPagesFilter().toString(),
    );
    setSavedDraft(d);
    setFilterSheetOpen(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View
        style={[
          styles.headerRow,
          {
            top: searchBarTop,
          },
        ]}
      >
        <View
          style={[
            styles.headerButtonWrap,
            {
              width: headerChrome.buttonSize,
              height: headerChrome.buttonWrapHeight,
              marginRight: headerChrome.gap,
            },
          ]}
        />
        <SearchBar
          style={styles.searchBarFlex}
          placeholder="Search saved"
          value={nameInput}
          onChangeText={setNameInput}
        />
        <View
          style={[
            styles.headerButtonWrap,
            {
              width: headerChrome.buttonSize,
              height: headerChrome.buttonWrapHeight,
              marginLeft: headerChrome.gap,
            },
          ]}
        >
          <FilterButton persisted={savedPagesPersisted} onPress={openFilterSheet} />
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + searchChrome.stackedAnchorOffset,
            gap: previewMetrics.itemGap,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <ConstantText
            size={uiScale.toast.text.message}
            typography={textStyle.toast.message}
            style={[styles.emptyText, { color: text.secondary }]}
          >
            {savedEntries.length === 0
              ? "No saved pages yet."
              : "No pages match your search."}
          </ConstantText>
        ) : (
          filtered.map((entry) => (
            <PagePreview
              key={entry.preview.id}
              preview={entry.preview}
              pageHref="saved"
              showMiniDownload
            />
          ))
        )}
      </ScrollView>
      <FilterBottomSheet
        visible={filterSheetOpen}
        onClose={() => {
          setFilterSheetOpen(false);
          setSavedDraft(null);
        }}
        mode={
          filterSheetOpen && savedDraft != null
            ? {
                kind: "saved-pages",
                draft: savedDraft,
                onDraftChange: (f) => {
                  setSavedDraft(f);
                  persistSavedPagesFilter(
                    SavedPagesFilter.fromJsonString(f.toString()),
                  );
                },
                persisted: savedPagesPersisted,
                onRevert: () => {
                  persistSavedPagesFilter(null);
                  setSavedDraft(SavedPagesFilter.defaultFilter());
                },
              }
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarFlex: {
    flex: 1,
    minWidth: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 24,
  },
});
