/**
 * CategoryPanel.tsx - Refactored for new Header structure
 * Uses GlobalHeaderContext for state management
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
  Linking,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useAppContext } from "../../hooks/useAppContext";
import { useGlobalHeader } from "./GlobalHeaderContext";
import { useAppDispatch } from "@/src/store";
import { logoutUser } from "@/src/store/appSlice";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PANEL_WIDTH = Math.min(308, SCREEN_WIDTH * 0.85);

interface CategoryItem {
  _id?: string;
  id?: string;
  name?: string;
  icon?: string;
  children?: CategoryItem[];
  _depth?: number;
  _parent?: string | null;
  _parentId?: string | null;
  _grandParentId?: string | null;
}

interface CategoryPanelProps {
  isOpenCatPanel: boolean;
  setIsOpenCatPanel: (val: boolean) => void;
  data: CategoryItem[];
}

// ─ URL / ROUTE BUILDER ─
function buildProductParams(
  item: CategoryItem,
  level: "main" | "sub" | "subsub" = "main",
  parentId: string | null = null,
  grandParentId: string | null = null
): Record<string, string> {
  const id = item?._id || item?.id || "";
  if (!id) return {};

  const params: Record<string, string> = {
    catName: item?.name || "",
    level,
  };

  if (level === "main") {
    params.catId = id;
  } else if (level === "sub") {
    params.subCatId = id;
    if (parentId) params.catId = parentId;
  } else {
    params.thirdLavelCatId = id;
    if (parentId) params.subCatId = parentId;
    if (grandParentId) params.catId = grandParentId;
  }
  return params;
}

// ─ FLATTEN CATEGORIES ─
function flattenCategories(
  cats: CategoryItem[],
  result: CategoryItem[] = [],
  depth = 0,
  parent: string | null = null,
  parentId: string | null = null,
  grandParentId: string | null = null
): CategoryItem[] {
  if (!Array.isArray(cats)) return result;
  cats.forEach((cat) => {
    const id = cat?._id || cat?.id || "";
    result.push({
      ...cat,
      _depth: depth,
      _parent: parent,
      _parentId: parentId,
      _grandParentId: grandParentId,
    });
    if (cat.children?.length) {
      flattenCategories(
        cat.children,
        result,
        depth + 1,
        cat.name ?? null,
        id || null,
        parentId
      );
    }
  });
  return result;
}

// ─ HIGHLIGHT COMPONENT ─
const Highlight: React.FC<{ text?: string; query: string }> = ({
  text = "",
  query,
}) => {
  if (!query || !text) return <Text>{text}</Text>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={styles.resultLabel}>{text}</Text>;
  return (
    <Text style={styles.resultLabel}>
      {text.slice(0, idx)}
      <Text style={styles.highlightMark}>
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
};

// ─ SKELETON LOADER ─
const SKEL_WIDTHS = [90, 68, 82, 55, 76, 63, 88];

const SkeletonLoader: React.FC = () => (
  <View style={{ padding: 16 }}>
    {SKEL_WIDTHS.map((w, i) => (
      <View key={i} style={styles.skelRow}>
        <View style={styles.skelIcon} />
        <View style={[styles.skelLine, { width: `${w * 0.7}%` }]} />
      </View>
    ))}
  </View>
);

// ─ SUB-SUB ROW ─
interface SubSubRowProps {
  item: CategoryItem;
  parentId: string | null;
  grandParentId: string | null;
  onNavigate: (params: Record<string, string>) => void;
}

const SubSubRow: React.FC<SubSubRowProps> = ({
  item,
  parentId,
  grandParentId,
  onNavigate,
}) => {
  const params = buildProductParams(item, "subsub", parentId, grandParentId);
  return (
    <TouchableOpacity
      style={styles.subSubRow}
      onPress={() => onNavigate(params)}
      activeOpacity={0.7}
    >
      <View style={styles.subSubDot} />
      <Text style={styles.subSubLabel} numberOfLines={1}>
        {item?.name}
      </Text>
      <Text style={styles.chev}>›</Text>
    </TouchableOpacity>
  );
};

// ─ SUB ROW ─
interface SubRowProps {
  item: CategoryItem;
  parentId: string | null;
  onNavigate: (params: Record<string, string>) => void;
}

const SubRow: React.FC<SubRowProps> = ({ item, parentId, onNavigate }) => {
  const [open, setOpen] = useState<boolean>(false);
  const hasSubs = (item?.children?.length ?? 0) > 0;
  const params = buildProductParams(item, "sub", parentId);

  return (
    <View>
      {hasSubs ? (
        <View style={styles.subRow}>
          <View style={[styles.subDot, open && styles.subDotOpen]} />

          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => onNavigate(params)}
            activeOpacity={0.7}
          >
            <Text style={styles.subLabel} numberOfLines={1}>
              {item?.name}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setOpen((p) => !p)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.chev,
                { transform: [{ rotate: open ? "90deg" : "0deg" }] },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.subRow}
          onPress={() => onNavigate(params)}
          activeOpacity={0.7}
        >
          <View style={styles.subDot} />
          <Text style={styles.subLabel} numberOfLines={1}>
            {item?.name}
          </Text>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>
      )}

      {hasSubs && open && (
        <View style={styles.subSubContainer}>
          {item.children!.map((ssub, i) => (
            <SubSubRow
              key={ssub?._id || i}
              item={ssub}
              parentId={item?._id || item?.id || null}
              grandParentId={parentId}
              onNavigate={onNavigate}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ─ CATEGORY ROW ─
interface CategoryRowProps {
  item: CategoryItem;
  index: number;
  onNavigate: (params: Record<string, string>) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ item, onNavigate }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const hasSubs = (item?.children?.length ?? 0) > 0;
  const params = buildProductParams(item, "main");

  return (
    <View style={styles.catRow}>
      <View style={[styles.catInner, expanded && styles.catInnerExpanded]}>
        {expanded && <View style={styles.accentBar} />}

        <View
          style={[
            styles.catIconBox,
            expanded && styles.catIconBoxExpanded,
          ]}
        >
          {item?.icon ? (
            <Text style={{ fontSize: 17 }}>{item.icon}</Text>
          ) : (
            <Text style={{ fontSize: 13, color: "#f97316" }}>⊞</Text>
          )}
        </View>

        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => onNavigate(params)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.catLabel,
              expanded && styles.catLabelExpanded,
            ]}
            numberOfLines={1}
          >
            {item?.name}
          </Text>
        </TouchableOpacity>

        {hasSubs && (
          <TouchableOpacity
            style={styles.catToggle}
            onPress={() => setExpanded((p) => !p)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.subCountChip}>
              <Text style={styles.subCountText}>{item.children!.length}</Text>
            </View>
            <Text
              style={[
                styles.chev,
                { transform: [{ rotate: expanded ? "90deg" : "0deg" }] },
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        )}

        {!hasSubs && <Text style={[styles.chev, { color: "#d1d5db" }]}>›</Text>}
      </View>

      {hasSubs && expanded && (
        <View style={styles.subContainer}>
          {item.children!.map((sub, i) => (
            <SubRow
              key={sub?._id || i}
              item={sub}
              parentId={item?._id || item?.id || null}
              onNavigate={onNavigate}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ─ SEARCH RESULTS ─
interface SearchResultsProps {
  results: CategoryItem[];
  query: string;
  onNavigate: (params: Record<string, string>) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  onNavigate,
}) => {
  if (!results.length) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyText}>
          No categories found for{"\n"}
          <Text style={{ color: "#f97316", fontWeight: "600" }}>
            "{query}"
          </Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingVertical: 6 }}>
      {results.map((item, i) => {
        const level =
          item._depth === 0 ? "main" : item._depth === 1 ? "sub" : "subsub";
        const params = buildProductParams(
          item,
          level as "main" | "sub" | "subsub",
          item._parentId ?? null,
          item._grandParentId ?? null
        );
        const dotColor =
          item._depth === 0
            ? "#f97316"
            : item._depth === 1
            ? "rgba(249,115,22,0.45)"
            : "rgba(249,115,22,0.2)";
        return (
          <TouchableOpacity
            key={i}
            style={styles.resultRow}
            onPress={() => onNavigate(params)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.resultDot, { backgroundColor: dotColor }]}
            />
            <View style={{ flex: 1 }}>
              <Highlight text={item?.name} query={query} />
              {item._parent != null && (
                <Text style={styles.resultParent}>
                  {item._depth === 1 ? "in " : "sub of "}{item._parent}
                </Text>
              )}
            </View>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>📦 Products</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─ MAIN CATEGORY PANEL ─
const CategoryPanel: React.FC<CategoryPanelProps> = (props) => {
  const context = useAppContext();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<CategoryItem[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [allFlat, setAllFlat] = useState<CategoryItem[]>([]);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const data = props?.data;
    if (Array.isArray(data) && data.length > 0) {
      setAllFlat(flattenCategories(data));
    }
  }, [props?.data]);

  useEffect(() => {
    if (props.isOpenCatPanel) {
      setSearchQuery("");
      setSearchResults([]);
      setSearching(false);
      setTimeout(() => inputRef.current?.focus(), 340);
    }
  }, [props.isOpenCatPanel]);

  useEffect(() => {
    AsyncStorage.getItem("logo").then((val) => {
      if (val) setLogoUri(val);
    });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearching(false);
      setSearchResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const results = allFlat.filter((c) => {
        const nameMatch = c?.name?.toLowerCase().includes(q);
        const parentMatch = c?._parent?.toLowerCase().includes(q);
        return nameMatch || parentMatch;
      });
      setSearchResults(results);
      setSearching(false);
    }, 210);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, allFlat]);

  const closePanel = useCallback(() => {
    props.setIsOpenCatPanel(false);
  }, [props]);

  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      closePanel();
      navigation.navigate("Login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [dispatch, navigation, closePanel]);

  const handleNavigate = useCallback(
    (params: Record<string, string>) => {
      closePanel();
      navigation.navigate("Products", params);
    },
    [closePanel, navigation]
  );

  const isLoading = !props?.data || props?.data?.length === 0;
  const hasSearch = searchQuery.trim().length > 0;
  const totalCats = props?.data?.length || 0;

  return (
    <Modal
      visible={props.isOpenCatPanel}
      transparent
      animationType="slide"
      onRequestClose={closePanel}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={closePanel}
      />

      {/* Panel */}
      <View style={styles.panel}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.logoImg}
                resizeMode="contain"
              />
            ) : (
              <>
                <View style={styles.logoIconBox}>
                  <Text style={{ fontSize: 13, color: "#fff" }}>⊞</Text>
                </View>
                <Text style={styles.logoText}>Categories</Text>
              </>
            )}
          </View>

          <View style={styles.headerRight}>
            {/* Seller Button */}
            <TouchableOpacity
              style={styles.sellerBtn}
              onPress={() =>
                Linking.openURL("https://decemberadmin-2grx.vercel.app/")
              }
              activeOpacity={0.85}
            >
              <Text style={styles.sellerBtnText}>🏠 Sell ›</Text>
            </TouchableOpacity>

            {!isLoading && (
              <View style={styles.deptChip}>
                <Text style={styles.deptChipText}>{totalCats} depts</Text>
              </View>
            )}

            {/* Close */}
            <TouchableOpacity style={styles.closeBtn} onPress={closePanel}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search ── */}
        <View style={styles.searchWrap}>
          <View style={styles.searchInner}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search categories…"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.searchClear}
              >
                <Text style={{ fontSize: 11, color: "#6b7280" }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {hasSearch && !searching && (
            <Text style={styles.searchMeta}>
              {searchResults.length > 0 ? (
                <Text>
                  <Text style={{ color: "#f97316" }}>
                    {searchResults.length}
                  </Text>{" "}
                  result{searchResults.length !== 1 ? "s" : ""}
                </Text>
              ) : (
                "No matches"
              )}
            </Text>
          )}
        </View>

        {/* ── Section Label ── */}
        {!hasSearch && (
          <View style={styles.sectionLabel}>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionLabelText}>All Departments</Text>
            <View style={styles.sectionLine} />
          </View>
        )}

        {/* ── Scroll Area ── */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {isLoading ? (
            <SkeletonLoader />
          ) : hasSearch ? (
            searching ? (
              <SkeletonLoader />
            ) : (
              <SearchResults
                results={searchResults}
                query={searchQuery}
                onNavigate={handleNavigate}
              />
            )
          ) : (
            props.data.map((cat, i) => (
              <CategoryRow
                key={cat?._id || i}
                item={cat}
                index={i}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </ScrollView>

        {/* ── Auth Section ── */}
        <View style={styles.authSection}>
          {context?.isLogin ? (
            <View style={styles.authCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {context?.userData?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.authName} numberOfLines={1}>
                  {context?.userData?.name || "User"}
                </Text>
                <Text style={styles.authEmail} numberOfLines={1}>
                  {context?.userData?.email || ""}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutBtnText}>🚪 Logout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loginCard}>
              <Text style={styles.loginTitle}>Sign in to your account</Text>
              <Text style={styles.loginSub}>
                Track orders, save addresses &amp; more
              </Text>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => {
                  closePanel();
                  navigation.navigate("Login");
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.loginBtnText}>→ Login to Continue</Text>
              </TouchableOpacity>

              <Text style={styles.registerPrompt}>
                New here?{" "}
                <Text
                  style={styles.registerLink}
                  onPress={() => {
                    closePanel();
                    navigation.navigate("Register");
                  }}
                >
                  Create account
                </Text>
              </Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.footerText}>All categories live</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              closePanel();
              navigation.navigate("Products");
            }}
          >
            <Text style={styles.viewAllText}>All Products ›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CategoryPanel;

// ─ STYLES ─
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    width: PANEL_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#fff",
    flexDirection: "column",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    height: 58,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.07)",
    flexShrink: 0,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 7 },
  logoImg: { maxHeight: 28, width: 100 },
  logoIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  sellerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#f97316",
  },
  sellerBtnText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  deptChip: {
    backgroundColor: "rgba(249,115,22,0.07)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deptChipText: { fontSize: 10, color: "#6b7280" },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontSize: 14, color: "#9ca3af" },
  searchWrap: {
    paddingHorizontal: 13,
    paddingTop: 11,
    paddingBottom: 7,
    flexShrink: 0,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 10,
  },
  searchIcon: { fontSize: 13, marginRight: 4 },
  searchInput: { flex: 1, fontSize: 13, color: "#1a1a1a", paddingVertical: 9 },
  searchClear: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchMeta: { fontSize: 11, color: "#6b7280", marginTop: 7, paddingLeft: 2 },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexShrink: 0,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.07)" },
  sectionLabelText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#9ca3af",
    marginHorizontal: 8,
  },
  catRow: { marginBottom: 1 },
  catInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    borderRadius: 10,
    position: "relative",
  },
  catInnerExpanded: { backgroundColor: "rgba(249,115,22,0.06)" },
  accentBar: {
    position: "absolute",
    left: 0,
    top: "20%",
    bottom: "20%",
    width: 3,
    backgroundColor: "#f97316",
    borderRadius: 3,
  },
  catIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "rgba(249,115,22,0.08)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  catIconBoxExpanded: {
    backgroundColor: "rgba(249,115,22,0.14)",
    borderColor: "rgba(249,115,22,0.4)",
  },
  catLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    letterSpacing: 0.1,
  },
  catLabelExpanded: { color: "#ea580c", fontWeight: "600" },
  catToggle: { flexDirection: "row", alignItems: "center", gap: 6 },
  subCountChip: {
    backgroundColor: "rgba(249,115,22,0.08)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.18)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  subCountText: { fontSize: 10, color: "#6b7280" },
  subContainer: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(249,115,22,0.12)",
    marginLeft: 33,
    paddingBottom: 4,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingLeft: 46,
    paddingRight: 13,
    marginHorizontal: 8,
    borderRadius: 8,
    gap: 8,
  },
  subDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  subDotOpen: { backgroundColor: "#f97316" },
  subLabel: { flex: 1, fontSize: 13, color: "#4b5563" },
  subSubContainer: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(249,115,22,0.12)",
    marginLeft: 52,
  },
  subSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 7,
    paddingLeft: 14,
    paddingRight: 13,
    marginHorizontal: 8,
    borderRadius: 7,
  },
  subSubDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1.5,
    borderColor: "rgba(148,163,184,0.3)",
  },
  subSubLabel: { flex: 1, fontSize: 12, color: "#6b7280" },
  chev: { fontSize: 18, color: "#9ca3af" },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginHorizontal: 8,
    borderRadius: 9,
  },
  resultDot: { width: 7, height: 7, borderRadius: 3.5 },
  resultLabel: { fontSize: 13, color: "#4b5563" },
  highlightMark: {
    backgroundColor: "rgba(99,102,241,0.2)",
    color: "#818cf8",
    borderRadius: 3,
  },
  resultParent: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  resultBadge: {
    backgroundColor: "rgba(249,115,22,0.07)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.15)",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  resultBadgeText: { fontSize: 10, color: "#6b7280" },
  emptyWrap: { padding: 38, alignItems: "center" },
  emptyIcon: { fontSize: 28, marginBottom: 10 },
  emptyText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  skelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 13,
  },
  skelIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#e5e7eb",
  },
  skelLine: { height: 13, borderRadius: 6, backgroundColor: "#e5e7eb" },
  authSection: {
    padding: 13,
    paddingTop: 10,
    flexShrink: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  authCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    borderRadius: 11,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  authName: { fontSize: 13, fontWeight: "600", color: "#1f2937" },
  authEmail: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  logoutBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
    backgroundColor: "rgba(239,68,68,0.07)",
  },
  logoutBtnText: { fontSize: 12, fontWeight: "600", color: "#f87171" },
  loginCard: {
    backgroundColor: "rgba(249,115,22,0.04)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.15)",
    borderRadius: 11,
    padding: 13,
  },
  loginTitle: { fontSize: 13, fontWeight: "600", color: "#1f2937" },
  loginSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
    lineHeight: 17,
  },
  loginBtn: {
    marginTop: 9,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.4)",
    backgroundColor: "rgba(249,115,22,0.08)",
    alignItems: "center",
  },
  loginBtnText: { fontSize: 13, fontWeight: "600", color: "#ea580c" },
  registerPrompt: {
    marginTop: 8,
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
  registerLink: { color: "#f97316", fontWeight: "600" },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.07)",
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#22c55e",
  },
  footerText: { fontSize: 11, color: "#6b7280" },
  viewAllText: { fontSize: 11, color: "#f97316", fontWeight: "600" },
});
