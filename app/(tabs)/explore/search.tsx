import {
  SearchPagePreview,
  SearchRegionPreview,
} from "@/components/searchPreview";
import {
  Method,
  RopeGeoHttpRequest,
  Service,
  SERVICE_BASE_URL,
} from "@/components/RopeGeoHttpRequest";
import { FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PagePreview, RegionPreview } from "ropegeo-common";
import { SearchParams, SearchResults } from "ropegeo-common";

const HEADER_BUTTON_SIZE = 44;

function isSearchPagePreview(
  r: PagePreview | RegionPreview
): r is PagePreview {
  return r.previewType === "page";
}

function isSearchRegionPreview(
  r: PagePreview | RegionPreview
): r is RegionPreview {
  return r.previewType === "region";
}

const HEADER_BUTTON_GAP = 8;
const SEARCH_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;
const LOAD_MORE_THRESHOLD = 100;

type SearchResultItem = PagePreview | RegionPreview;

function SyncSearchData({
  data,
  onData,
}: {
  data: SearchResults | null;
  onData: (data: SearchResults) => void;
}) {
  useEffect(() => {
    if (data) onData(data);
  }, [data, onData]);
  return null;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setResults([]);
    setNextCursor(null);
  }, [debouncedQuery]);

  const searchParams = useMemo(() => {
    if (debouncedQuery.length === 0) return null;
    return new SearchParams(
      debouncedQuery,
      0.5,
      true,
      true,
      false,
      null,
      "quality",
      SEARCH_LIMIT,
      null
    );
  }, [debouncedQuery]);

  const queryParams = useMemo(
    () => searchParams?.toQueryStringParams() ?? {},
    [searchParams]
  );

  const syncInitialData = useCallback((data: SearchResults) => {
    setResults(data.results);
    setNextCursor(data.nextCursor);
  }, []);

  const loadMore = useCallback(async () => {
    // Only load the next page when we have a cursor and we're not already loading.
    if (nextCursor == null || debouncedQuery.length === 0) return;
    if (loadingMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    // Use base query params and append cursor as-is. Avoid SearchParams with cursor
    // so we never decode it in the app (Buffer/base64url can fail in React Native).
    const paramsWithCursor = { ...queryParams, cursor: nextCursor };
    const url = `${SERVICE_BASE_URL[Service.WEBSCRAPER]}/search?${new URLSearchParams(
      paramsWithCursor
    ).toString()}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) {
        return;
      }
      const raw = JSON.parse(text) as
        | { results?: SearchResultItem[]; nextCursor?: string | null }
        | { data?: { results?: SearchResultItem[]; nextCursor?: string | null } };
      const data = (raw && "data" in raw && raw.data != null ? raw.data : raw) as {
        results?: SearchResultItem[];
        nextCursor?: string | null;
      };
      const nextResults = Array.isArray(data.results) ? data.results : [];
      const newNextCursor = data.nextCursor ?? null;
      setResults((prev) => [...prev, ...nextResults]);
      setNextCursor(newNextCursor);
    } catch {
      // ignore; nextCursor unchanged so user can scroll to retry
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [debouncedQuery, nextCursor, loadingMore, queryParams]);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const canScroll = contentSize.height > layoutMeasurement.height;
      const isNearBottom =
        contentOffset.y + layoutMeasurement.height >=
        contentSize.height - LOAD_MORE_THRESHOLD;
      if (
        canScroll &&
        isNearBottom &&
        nextCursor != null &&
        !loadingMore
      ) {
        loadMore();
      }
    },
    [nextCursor, loadingMore, loadMore]
  );

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }, [])
  );

  const searchBarTop = insets.top + 8;
  const searchBarHeight = 48;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.headerRow,
          {
            top: searchBarTop,
          },
        ]}
      >
        <View style={[styles.headerButtonWrap, { width: HEADER_BUTTON_SIZE, marginRight: HEADER_BUTTON_GAP }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.headerButtonPressed,
            ]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <FontAwesome5 name="chevron-left" size={20} color="#111827" />
          </Pressable>
        </View>
        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={16} color="#6b7280" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchBarInput}
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <View style={[styles.headerButtonWrap, { width: HEADER_BUTTON_SIZE, marginLeft: HEADER_BUTTON_GAP }]}>
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.headerButtonPressed,
            ]}
            accessibilityLabel="Filter"
            accessibilityRole="button"
          >
            <FontAwesome5 name="filter" size={18} color="#111827" />
          </Pressable>
        </View>
      </View>
      <Pressable
        style={styles.content}
        onPress={() => searchInputRef.current?.blur()}
      >
      {searchParams == null ? (
        <View style={[styles.centered, { paddingTop: searchBarTop + searchBarHeight + 12 }]}>
          <Text style={styles.hint}>Type a search term to query the API.</Text>
        </View>
      ) : (
        <RopeGeoHttpRequest<SearchResults>
          service={Service.WEBSCRAPER}
          method={Method.GET}
          path="/search"
          queryParams={queryParams}
        >
          {({ loading, data, errors }) => (
            <>
              <SyncSearchData data={data} onData={syncInitialData} />
              {loading && results.length === 0 && (
                <View style={[styles.centered, { paddingTop: searchBarTop + searchBarHeight + 12 }]}>
                  <ActivityIndicator size="large" />
                </View>
              )}
              {errors != null && !loading && results.length === 0 && (
                <View style={[styles.centered, { paddingTop: searchBarTop + searchBarHeight + 12 }]}>
                  <Text style={styles.errorText}>{errors.message}</Text>
                </View>
              )}
              {!loading && errors == null && data != null && (
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: searchBarTop + searchBarHeight + 12 },
                  ]}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {results.map((item, index) =>
                    isSearchPagePreview(item) ? (
                      <SearchPagePreview key={`page-${item.id}-${index}`} preview={item} />
                    ) : isSearchRegionPreview(item) ? (
                      <SearchRegionPreview key={`region-${item.id}-${index}`} preview={item} />
                    ) : null
                  )}
                  {loadingMore ? (
                    <View style={styles.loadMoreIndicator}>
                      <ActivityIndicator size="small" />
                    </View>
                  ) : null}
                </ScrollView>
              )}
            </>
          )}
        </RopeGeoHttpRequest>
      )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
    height: HEADER_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    borderRadius: HEADER_BUTTON_SIZE / 2,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerButtonPressed: {
    opacity: 0.6,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    minWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
    minWidth: 0,
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadMoreIndicator: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
  },
  hint: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
});
