import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../supabase';

type Report = {
  id: string;
  image_path: string | null;
  issue_type: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  place_name: string | null;
  ai_confidence: number | null;
  ai_severity: string | null;
  ai_reason: string | null;
  reported_at: string | null;
  status: string | null;

  upvote_count: number;
  follower_count: number;
  user_has_upvoted: boolean;
  user_is_following: boolean;
};

export default function IssueDetails() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [report, setReport] = useState<Report | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'Report ID is missing.');
      router.back();
      return;
    }

    loadReport();
  }, [id]);

  // ============================================
  // LOAD REPORT USING YOUR EXISTING RPC
  // ============================================

  const loadReport = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc(
        'get_report_feed',
        {
          p_mode: 'search',
          p_lat: null,
          p_lon: null,
          p_radius_km: null,
          p_search: null,
          p_report_id: id,
          p_limit: 1,
        }
      );

      if (error) {
        console.error(
          'Report RPC error:',
          error
        );

        Alert.alert(
          'Error',
          'Unable to load this report.'
        );

        return;
      }

      if (!data || data.length === 0) {
        Alert.alert(
          'Error',
          'Issue not found.'
        );

        return;
      }

      const reportData = data[0] as Report;

      setReport(reportData);

      // ==========================================
      // CREATE SIGNED IMAGE URL
      // ==========================================

      if (reportData.image_path) {
        const {
          data: signedData,
          error: imageError,
        } = await supabase.storage
          .from('reports')
          .createSignedUrl(
            reportData.image_path,
            60 * 60
          );

        if (imageError) {
          console.error(
            'Image URL error:',
            imageError
          );
        } else if (signedData?.signedUrl) {
          setImageUrl(
            signedData.signedUrl
          );
        }
      }
    } catch (error) {
      console.error(
        'Issue details error:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong while loading the issue.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // UPVOTE / REMOVE UPVOTE
  // ============================================

  const toggleUpvote = async () => {
    if (!report) return;

    try {
      setUpvoteLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login to upvote an issue.'
        );

        return;
      }

      // ========================================
      // REMOVE UPVOTE
      // ========================================

      if (report.user_has_upvoted) {
        const { error } = await supabase
          .from('report_upvotes')
          .delete()
          .eq('report_id', report.id)
          .eq('user_id', user.id);

        if (error) {
          console.error(
            'Remove upvote error:',
            error
          );

          Alert.alert(
            'Error',
            'Unable to remove your upvote.'
          );

          return;
        }

        setReport((previous) =>
          previous
            ? {
                ...previous,
                user_has_upvoted: false,
                upvote_count: Math.max(
                  previous.upvote_count - 1,
                  0
                ),
              }
            : previous
        );

        return;
      }

      // ========================================
      // ADD UPVOTE
      // ========================================

      const { error } = await supabase
        .from('report_upvotes')
        .insert({
          report_id: report.id,
          user_id: user.id,
        });

      if (error) {
        console.error(
          'Add upvote error:',
          error
        );

        // Already upvoted
        if (error.code === '23505') {
          setReport((previous) =>
            previous
              ? {
                  ...previous,
                  user_has_upvoted: true,
                }
              : previous
          );

          return;
        }

        Alert.alert(
          'Error',
          'Unable to upvote this issue.'
        );

        return;
      }

      setReport((previous) =>
        previous
          ? {
              ...previous,
              user_has_upvoted: true,
              upvote_count:
                previous.upvote_count + 1,
            }
          : previous
      );
    } catch (error) {
      console.error(
        'Toggle upvote error:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong.'
      );
    } finally {
      setUpvoteLoading(false);
    }
  };

  // ============================================
  // FOLLOW / UNFOLLOW
  // ============================================

  const toggleFollow = async () => {
    if (!report) return;

    try {
      setFollowLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login to follow an issue.'
        );

        return;
      }

      // ========================================
      // UNFOLLOW
      // ========================================

      if (report.user_is_following) {
        const { error } = await supabase
          .from('report_follows')
          .delete()
          .eq('report_id', report.id)
          .eq('user_id', user.id);

        if (error) {
          console.error(
            'Unfollow error:',
            error
          );

          Alert.alert(
            'Error',
            'Unable to unfollow this issue.'
          );

          return;
        }

        setReport((previous) =>
          previous
            ? {
                ...previous,
                user_is_following: false,
                follower_count: Math.max(
                  previous.follower_count - 1,
                  0
                ),
              }
            : previous
        );

        return;
      }

      // ========================================
      // FOLLOW
      // ========================================

      const { error } = await supabase
        .from('report_follows')
        .insert({
          report_id: report.id,
          user_id: user.id,
        });

      if (error) {
        console.error(
          'Follow error:',
          error
        );

        // Already following
        if (error.code === '23505') {
          setReport((previous) =>
            previous
              ? {
                  ...previous,
                  user_is_following: true,
                }
              : previous
          );

          return;
        }

        Alert.alert(
          'Error',
          'Unable to follow this issue.'
        );

        return;
      }

      setReport((previous) =>
        previous
          ? {
              ...previous,
              user_is_following: true,
              follower_count:
                previous.follower_count + 1,
            }
          : previous
      );
    } catch (error) {
      console.error(
        'Toggle follow error:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong.'
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const formatDate = (
    date: string | null
  ) => {
    if (!date) {
      return 'Not available';
    }

    try {
      return new Date(date).toLocaleString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      );
    } catch {
      return date;
    }
  };

  const formatCoordinate = (
    value: number | null
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return 'Not available';
    }

    return Number(value).toFixed(6);
  };

  const formatConfidence = (
    confidence: number | null
  ) => {
    if (
      confidence === null ||
      confidence === undefined
    ) {
      return 'Not available';
    }

    const percentage =
      confidence <= 1
        ? confidence * 100
        : confidence;

    return `${percentage.toFixed(1)}%`;
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading issue...
        </Text>
      </View>
    );
  }

  // ============================================
  // REPORT NOT FOUND
  // ============================================

  if (!report) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          Issue not found.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
        >
          <Text style={styles.headerBackText}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Issue Details
        </Text>

        <View style={{ width: 42 }} />

      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* IMAGE */}

        <View style={styles.imageContainer}>

          {imageUrl ? (
            <Image
              source={{
                uri: imageUrl,
              }}
              style={styles.issueImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImage}>

              <Text style={styles.noImageText}>
                Image unavailable
              </Text>

            </View>
          )}

        </View>

        {/* TITLE */}

        <View style={styles.titleSection}>

          <Text style={styles.issueType}>
            {report.issue_type ||
              'Civic Issue'}
          </Text>

          {report.ai_severity && (
            <View
              style={[
                styles.severityBadge,

                report.ai_severity.toLowerCase() ===
                'high'
                  ? styles.highSeverity
                  : report.ai_severity.toLowerCase() ===
                    'medium'
                  ? styles.mediumSeverity
                  : styles.lowSeverity,
              ]}
            >
              <Text style={styles.severityText}>
                {report.ai_severity.toUpperCase()}
              </Text>
            </View>
          )}

        </View>

        {/* ====================================== */}
        {/* UPVOTE + FOLLOW */}
        {/* ====================================== */}

        <View style={styles.engagementCard}>

          {/* UPVOTE */}

          <TouchableOpacity
            style={[
              styles.engagementButton,

              report.user_has_upvoted &&
                styles.activeButton,
            ]}
            onPress={toggleUpvote}
            disabled={upvoteLoading}
            activeOpacity={0.8}
          >

            {upvoteLoading ? (
              <ActivityIndicator
                size="small"
              />
            ) : (
              <Text
                style={[
                  styles.engagementIcon,

                  report.user_has_upvoted &&
                    styles.activeIcon,
                ]}
              >
                ▲
              </Text>
            )}

            <View>

              <Text
                style={[
                  styles.engagementNumber,

                  report.user_has_upvoted &&
                    styles.activeText,
                ]}
              >
                {report.upvote_count}
              </Text>

              <Text
                style={[
                  styles.engagementLabel,

                  report.user_has_upvoted &&
                    styles.activeText,
                ]}
              >
                {report.user_has_upvoted
                  ? 'Upvoted'
                  : 'Upvote'}
              </Text>

            </View>

          </TouchableOpacity>

          {/* FOLLOW */}

          <TouchableOpacity
            style={[
              styles.engagementButton,

              report.user_is_following &&
                styles.activeButton,
            ]}
            onPress={toggleFollow}
            disabled={followLoading}
            activeOpacity={0.8}
          >

            {followLoading ? (
              <ActivityIndicator
                size="small"
              />
            ) : (
              <Text
                style={[
                  styles.engagementIcon,

                  report.user_is_following &&
                    styles.activeIcon,
                ]}
              >
                {report.user_is_following
                  ? '●'
                  : '○'}
              </Text>
            )}

            <View>

              <Text
                style={[
                  styles.engagementNumber,

                  report.user_is_following &&
                    styles.activeText,
                ]}
              >
                {report.follower_count}
              </Text>

              <Text
                style={[
                  styles.engagementLabel,

                  report.user_is_following &&
                    styles.activeText,
                ]}
              >
                {report.user_is_following
                  ? 'Following'
                  : 'Follow'}
              </Text>

            </View>

          </TouchableOpacity>

        </View>

        {/* DESCRIPTION */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Description
          </Text>

          <Text style={styles.description}>
            {report.description ||
              'No description provided.'}
          </Text>

        </View>

        {/* LOCATION */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Location
          </Text>

          <InfoRow
            label="Place"
            value={
              report.place_name ||
              'Not available'
            }
          />

          <InfoRow
            label="Latitude"
            value={formatCoordinate(
              report.latitude
            )}
          />

          <InfoRow
            label="Longitude"
            value={formatCoordinate(
              report.longitude
            )}
          />

        </View>

        {/* AI VERIFICATION */}

        {(report.issue_type ||
          report.ai_confidence !== null ||
          report.ai_severity ||
          report.ai_reason) && (

          <View style={styles.card}>

            <Text style={styles.sectionTitle}>
              AI Verification
            </Text>

            {report.issue_type && (
              <InfoRow
                label="Detected Issue"
                value={
                  report.issue_type
                }
              />
            )}

            {report.ai_confidence !== null &&
              report.ai_confidence !==
                undefined && (

              <InfoRow
                label="Confidence"
                value={formatConfidence(
                  report.ai_confidence
                )}
              />

            )}

            {report.ai_severity && (
              <InfoRow
                label="AI Severity"
                value={
                  report.ai_severity
                }
              />
            )}

            {report.ai_reason && (

              <View
                style={styles.reasonContainer}
              >

                <Text
                  style={styles.infoLabel}
                >
                  Reason
                </Text>

                <Text
                  style={styles.reasonText}
                >
                  {report.ai_reason}
                </Text>

              </View>

            )}

          </View>

        )}

        {/* REPORT INFORMATION */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Report Information
          </Text>

          <InfoRow
            label="Reported"
            value={formatDate(
              report.reported_at
            )}
          />

          <InfoRow
            label="Status"
            value={
              report.status || 'Submitted'
            }
          />

        </View>

        {/* REPORT ID */}

        <View style={styles.idContainer}>

          <Text style={styles.idLabel}>
            Report ID
          </Text>

          <Text style={styles.idText}>
            {report.id}
          </Text>

        </View>

        <View style={{ height: 30 }} />

      </ScrollView>

    </View>
  );
}

/* ============================================ */
/* INFO ROW */
/* ============================================ */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>

    </View>
  );
}

/* ============================================ */
/* STYLES */
/* ============================================ */

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f6f7f9',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7f9',
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },

  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },

  header: {
    height: 60,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },

  headerBackButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerBackText: {
    fontSize: 36,
    lineHeight: 38,
    color: '#111',
    fontWeight: '300',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  scrollContent: {
    paddingBottom: 20,
  },

  imageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#e9e9e9',
  },

  issueImage: {
    width: '100%',
    height: '100%',
  },

  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  noImageText: {
    color: '#777',
    fontSize: 15,
  },

  titleSection: {
    backgroundColor: '#fff',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  issueType: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111',
    flex: 1,
    marginRight: 12,
  },

  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  highSeverity: {
    backgroundColor: '#ffe1e1',
  },

  mediumSeverity: {
    backgroundColor: '#fff0c7',
  },

  lowSeverity: {
    backgroundColor: '#ddf5df',
  },

  severityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
  },

  /* ======================================== */
  /* ENGAGEMENT */
  /* ======================================== */

  engagementCard: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
  },

  engagementButton: {
    flex: 1,
    minHeight: 68,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
  },

  activeButton: {
    backgroundColor: '#eeeeee',
    borderColor: '#111111',
  },

  engagementIcon: {
    fontSize: 23,
    color: '#555',
  },

  activeIcon: {
    color: '#111',
  },

  engagementNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222',
  },

  engagementLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },

  activeText: {
    color: '#111',
  },

  /* ======================================== */
  /* CARDS */
  /* ======================================== */

  card: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    padding: 18,
    borderRadius: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 14,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#555',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  infoLabel: {
    fontSize: 14,
    color: '#777',
    flex: 0.8,
  },

  infoValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
    flex: 1.4,
    textAlign: 'right',
  },

  reasonContainer: {
    marginTop: 14,
  },

  reasonText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#555',
  },

  idContainer: {
    marginTop: 16,
    paddingHorizontal: 18,
  },

  idLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },

  idText: {
    fontSize: 11,
    color: '#999',
  },

  backButton: {
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },

  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

});