import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabase';

type Report = {
  id: string;
  image_path: string;
  issue_type: string;
  description: string;
  latitude: number;
  longitude: number;
  place_name: string | null;
  ai_confidence: number | null;
  ai_severity: string | null;
  ai_reason: string | null;
  reported_at: string;
  status: string;
  upvote_count: number;
  follower_count: number;
  user_has_upvoted: boolean;
  user_is_following: boolean;
  image_url?: string;
};

export default function InfoScreen() {
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    loadCityReports();
  }, []);

  // =========================================
  // GET CURRENT CITY
  // =========================================

  const getCurrentCity = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      throw new Error(
        'Location permission is required to show civic issues in your city.'
      );
    }

    const currentLocation =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

    const latitude =
      currentLocation.coords.latitude;

    const longitude =
      currentLocation.coords.longitude;

    console.log(
      'Current coordinates:',
      latitude,
      longitude
    );

    const addresses =
      await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

    const address = addresses[0];

    const detectedCity =
      address?.city?.trim() ||
      address?.district?.trim() ||
      address?.subregion?.trim() ||
      address?.region?.trim();

    if (!detectedCity) {
      throw new Error(
        'Unable to determine your current city.'
      );
    }

    console.log(
      'Detected city:',
      detectedCity
    );

    setCity(detectedCity);

    return detectedCity;
  };

  // =========================================
  // CREATE SIGNED IMAGE URL
  // =========================================

  const addImageUrls = async (
    reportList: Report[]
  ) => {
    const reportsWithImages =
      await Promise.all(
        reportList.map(async (report) => {
          if (!report.image_path) {
            return report;
          }

          const { data, error } =
            await supabase.storage
              .from('reports')
              .createSignedUrl(
                report.image_path,
                60 * 60
              );

          if (error) {
            console.error(
              'Image URL error:',
              error
            );

            return report;
          }

          return {
            ...report,
            image_url:
              data?.signedUrl,
          };
        })
      );

    return reportsWithImages;
  };

  // =========================================
  // LOAD ALL REPORTS FROM CURRENT CITY
  // =========================================
  //
  // IMPORTANT:
  // We are NOT using the 10 km radius anymore.
  //
  // Your existing get_report_feed RPC already
  // supports p_mode = 'search' and p_search.
  //
  // Since report-form now stores the city in
  // place_name, searching the city will return
  // the city's reports without a radius.
  // =========================================

  const loadCityReports = async () => {
    try {
      setLoading(true);
      setError('');

      const currentCity =
        await getCurrentCity();

      const { data, error: rpcError } =
        await supabase.rpc(
          'get_report_feed',
          {
            p_mode: 'search',

            p_lat: null,

            p_lon: null,

            p_radius_km: null,

            p_search: currentCity,

            p_report_id: null,

            p_limit: 50,
          }
        );

      if (rpcError) {
        throw rpcError;
      }

      console.log(
        `Reports found for ${currentCity}:`,
        data?.length || 0
      );

      const reportsWithImages =
        await addImageUrls(
          data || []
        );

      setReports(
        reportsWithImages
      );
    } catch (err: any) {
      console.error(
        'City reports error:',
        err
      );

      setError(
        err?.message ||
          'Unable to load civic issues in your city.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // SEARCH
  // =========================================

  const searchReports = async () => {
    const query = search.trim();

    if (!query) {
      await loadCityReports();
      return;
    }

    try {
      setSearching(true);
      setError('');

      /*
       * Search using the existing RPC.
       *
       * This searches:
       * - place_name
       * - issue_type
       * - description
       *
       * Example:
       * "pothole"
       * "Hyderabad"
       * "Kukatpally"
       * "garbage"
       */

      const { data, error: rpcError } =
        await supabase.rpc(
          'get_report_feed',
          {
            p_mode: 'search',

            p_lat: null,

            p_lon: null,

            p_radius_km: null,

            p_search: query,

            p_report_id: null,

            p_limit: 50,
          }
        );

      if (rpcError) {
        throw rpcError;
      }

      const reportsWithImages =
        await addImageUrls(
          data || []
        );

      setReports(
        reportsWithImages
      );
    } catch (err: any) {
      console.error(
        'Search error:',
        err
      );

      setError(
        err?.message ||
          'Unable to search civic issues.'
      );
    } finally {
      setSearching(false);
    }
  };

  // =========================================
  // REFRESH
  // =========================================

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      if (search.trim()) {
        await searchReports();
      } else {
        await loadCityReports();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================
  // OPEN ISSUE
  // =========================================

  const openIssue = (
    reportId: string
  ) => {
    router.push({
      pathname: '/issue-details',
      params: {
        id: reportId,
      },
    });
  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (
    dateString: string
  ) => {
    const date =
      new Date(dateString);

    return date.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Finding civic issues in your city...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
    >
      {/* =============================== */}
      {/* HEADER */}
      {/* =============================== */}

      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          Civic Issues
        </Text>

        <Text
          style={styles.subtitle}
        >
          Discover issues reported in your city
        </Text>
      </View>

      {/* =============================== */}
      {/* SEARCH BAR */}
      {/* =============================== */}

      <View
        style={
          styles.searchContainer
        }
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Search place or civic issue..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={
            searchReports
          }
          returnKeyType="search"
          editable={!searching}
        />

        <TouchableOpacity
          style={
            styles.searchButton
          }
          onPress={
            searchReports
          }
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator
              color="white"
            />
          ) : (
            <Text
              style={
                styles.searchButtonText
              }
            >
              Search
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* =============================== */}
      {/* CURRENT CITY */}
      {/* =============================== */}

      {!search.trim() &&
        city && (
          <View
            style={
              styles.locationBanner
            }
          >
            <Text
              style={
                styles.locationTitle
              }
            >
              📍 Issues in {city}
            </Text>

            <Text
              style={
                styles.locationText
              }
            >
              Showing civic issues reported across your city
            </Text>
          </View>
        )}

      {/* =============================== */}
      {/* SEARCH RESULT TITLE */}
      {/* =============================== */}

      {search.trim() && (
        <View
          style={
            styles.resultHeader
          }
        >
          <View>
            <Text
              style={
                styles.resultTitle
              }
            >
              Search results
            </Text>

            {city && (
              <Text
                style={
                  styles.resultSubtitle
                }
              >
                Current city: {city}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => {
              setSearch('');
              loadCityReports();
            }}
          >
            <Text
              style={
                styles.clearText
              }
            >
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* =============================== */}
      {/* ERROR */}
      {/* =============================== */}

      {error ? (
        <View
          style={
            styles.errorContainer
          }
        >
          <Text
            style={styles.errorText}
          >
            {error}
          </Text>

          <TouchableOpacity
            style={
              styles.retryButton
            }
            onPress={
              loadCityReports
            }
          >
            <Text
              style={
                styles.retryText
              }
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* =============================== */}
      {/* REPORT LIST */}
      {/* =============================== */}

      <ScrollView
        style={styles.list}
        contentContainerStyle={
          styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              onRefresh
            }
          />
        }
      >
        {reports.length === 0 &&
        !error ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              🏙️
            </Text>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No civic issues found
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {search.trim()
                ? `No issues matching "${search}" were found.`
                : `There are no reported civic issues in ${city} yet.`}
            </Text>
          </View>
        ) : (
          reports.map(
            (report) => (
              <TouchableOpacity
                key={report.id}
                style={
                  styles.reportCard
                }
                activeOpacity={0.8}
                onPress={() =>
                  openIssue(
                    report.id
                  )
                }
              >
                {/* IMAGE */}

                {report.image_url ? (
                  <Image
                    source={{
                      uri: report.image_url,
                    }}
                    style={
                      styles.reportImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.reportImage,
                      styles.noImage,
                    ]}
                  >
                    <Text>
                      No image
                    </Text>
                  </View>
                )}

                {/* CONTENT */}

                <View
                  style={
                    styles.reportContent
                  }
                >
                  <View
                    style={
                      styles.issueHeader
                    }
                  >
                    <Text
                      style={
                        styles.issueType
                      }
                      numberOfLines={1}
                    >
                      {
                        report.issue_type
                      }
                    </Text>

                    {report.ai_severity && (
                      <View
                        style={
                          styles.severityBadge
                        }
                      >
                        <Text
                          style={
                            styles.severityText
                          }
                        >
                          {
                            report.ai_severity
                          }
                        </Text>
                      </View>
                    )}
                  </View>

                  {report.place_name && (
                    <Text
                      style={
                        styles.place
                      }
                      numberOfLines={1}
                    >
                      📍{' '}
                      {
                        report.place_name
                      }
                    </Text>
                  )}

                  <Text
                    style={
                      styles.description
                    }
                    numberOfLines={3}
                  >
                    {
                      report.description
                    }
                  </Text>

                  <Text
                    style={styles.date}
                  >
                    {formatDate(
                      report.reported_at
                    )}
                  </Text>

                  {/* STATS */}

                  <View
                    style={
                      styles.statsRow
                    }
                  >
                    <Text
                      style={
                        styles.stat
                      }
                    >
                      👍{' '}
                      {
                        report.upvote_count
                      }
                    </Text>

                    <Text
                      style={
                        styles.stat
                      }
                    >
                      👥{' '}
                      {
                        report.follower_count
                      }
                    </Text>

                    <Text
                      style={
                        styles.viewDetails
                      }
                    >
                      View details →
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#ffffff',
      paddingTop: 55,
    },

    centerContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems: 'center',
      padding: 20,
    },

    loadingText: {
      marginTop: 15,
      fontSize: 16,
    },

    header: {
      paddingHorizontal: 20,
      marginBottom: 15,
    },

    title: {
      fontSize: 30,
      fontWeight: 'bold',
    },

    subtitle: {
      marginTop: 5,
      fontSize: 15,
      color: '#666666',
    },

    searchContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 15,
    },

    searchInput: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderColor: '#cccccc',
      borderRadius: 10,
      paddingHorizontal: 15,
      fontSize: 15,
    },

    searchButton: {
      marginLeft: 8,
      paddingHorizontal: 18,
      height: 48,
      borderRadius: 10,
      backgroundColor:
        '#111111',
      justifyContent:
        'center',
      alignItems: 'center',
    },

    searchButtonText: {
      color: '#ffffff',
      fontWeight: 'bold',
    },

    locationBanner: {
      marginHorizontal: 20,
      marginBottom: 15,
      padding: 14,
      borderRadius: 10,
      backgroundColor:
        '#f2f2f2',
    },

    locationTitle: {
      fontSize: 16,
      fontWeight: 'bold',
    },

    locationText: {
      marginTop: 4,
      color: '#666666',
      fontSize: 13,
    },

    resultHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      paddingHorizontal: 20,
      marginBottom: 10,
    },

    resultTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    resultSubtitle: {
      marginTop: 3,
      fontSize: 13,
      color: '#777777',
    },

    clearText: {
      fontSize: 14,
      fontWeight: 'bold',
    },

    list: {
      flex: 1,
    },

    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },

    reportCard: {
      backgroundColor:
        '#f7f7f7',
      borderRadius: 14,
      marginBottom: 16,
      overflow: 'hidden',
    },

    reportImage: {
      width: '100%',
      height: 210,
    },

    noImage: {
      backgroundColor:
        '#e5e5e5',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    reportContent: {
      padding: 15,
    },

    issueHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    issueType: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
    },

    severityBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor:
        '#dddddd',
    },

    severityText: {
      fontSize: 12,
      fontWeight: 'bold',
      textTransform:
        'uppercase',
    },

    place: {
      marginTop: 8,
      fontSize: 14,
      color: '#555555',
    },

    description: {
      marginTop: 10,
      fontSize: 15,
      lineHeight: 21,
    },

    date: {
      marginTop: 10,
      fontSize: 12,
      color: '#777777',
    },

    statsRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 15,
    },

    stat: {
      marginRight: 18,
      fontSize: 14,
      fontWeight: '600',
    },

    viewDetails: {
      marginLeft: 'auto',
      fontSize: 13,
      fontWeight: 'bold',
    },

    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 70,
      paddingHorizontal: 30,
    },

    emptyIcon: {
      fontSize: 45,
      marginBottom: 15,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },

    emptyText: {
      marginTop: 8,
      textAlign: 'center',
      color: '#666666',
      lineHeight: 20,
    },

    errorContainer: {
      marginHorizontal: 20,
      marginBottom: 15,
      padding: 15,
      borderRadius: 10,
      backgroundColor:
        '#ffecec',
    },

    errorText: {
      color: '#b00020',
    },

    retryButton: {
      marginTop: 10,
    },

    retryText: {
      fontWeight: 'bold',
    },
  });