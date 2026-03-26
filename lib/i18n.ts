// Translations dictionary for GujaratiConnect
// Keeping this simple: flat key-value pairs per language

export type Locale = 'en' | 'gu';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Tab labels
    tab_discover: 'Discover',
    tab_community: 'Community',
    tab_events: 'Events',
    tab_profile: 'Profile',

    // Discover screen
    discover_title: 'Discover',
    discover_members: 'Members',
    discover_countries: 'Countries',
    discover_nearby: 'Nearby',
    discover_search_radius: 'Search Radius',
    discover_people_grid: 'Discover',
    discover_no_users: 'No users found nearby',
    discover_connect: 'Connect',
    discover_connected: 'Connected',
    discover_directory: 'Business Directory',
    discover_directory_sub: 'Find Gujarati-owned businesses near you',

    // Community screen
    community_title: 'Community',
    community_share_placeholder: 'Share something with the community...',
    community_trending: 'Trending',
    community_no_posts: 'No posts yet.',
    community_like: 'Like',
    community_comment: 'Comment',
    community_share: 'Share',
    community_comments_title: 'Comments',
    community_no_comments: 'No comments yet. Start the conversation!',
    community_comment_placeholder: 'Write a comment...',

    // Compose screen
    compose_placeholder: "What's happening in your community?",

    // Events screen
    events_title: 'Events',
    events_filter_all: 'All Events',
    events_filter_month: 'This Month',
    events_filter_near: 'Near Me',
    events_going: 'Going',
    events_interested: 'Interested',
    events_no_events: 'No events found',
    events_no_events_sub: 'Be the first to create one!',
    events_going_count: 'going',
    events_detail_about: 'About this Event',
    events_detail_organizer: 'Organizer',
    events_detail_attendees: 'Who\'s Going',
    events_detail_date: 'Date',
    events_detail_time: 'Time',
    events_detail_location: 'Location',
    events_detail_capacity: 'Capacity',
    events_rsvp: 'Mark as Going',
    events_rsvp_going: "You're Going!",

    // Profile screen
    profile_connections: 'Connections',
    profile_communities: 'Communities',
    profile_followers: 'Followers',
    profile_origin: 'Origin & Identity',
    profile_professional: 'Professional',
    profile_skills: 'Skills & Interests',
    profile_edit: 'Edit Profile',
    profile_requests: 'Connection Requests',
    profile_accept: 'Accept',
    profile_reject: 'Reject',
    profile_network: 'My Network',
    profile_message: 'Message',

    // Settings
    settings_title: 'Settings',
    settings_language: 'Language',
    settings_notifications: 'Notifications',
    settings_new_connections: 'New Connections',
    settings_messages: 'Messages',
    settings_events: 'Events',
    settings_logout: 'Log Out',
    settings_logout_confirm: 'Are you sure you want to log out?',
    settings_cancel: 'Cancel',

    // Common
    common_save: 'Save',
    common_cancel: 'Cancel',
    common_post: 'Post',
    common_publish: 'Publish',
    common_close: 'Close',
    common_free: 'Free',
    common_verified: 'Verified',
    common_loading: 'Loading...',
    common_no_data: 'No data available',
  },

  gu: {
    // Tab labels
    tab_discover: 'શોધો',
    tab_community: 'સમુદાય',
    tab_events: 'કાર્યક્રમો',
    tab_profile: 'પ્રોફાઇલ',

    // Discover screen
    discover_title: 'શોધો',
    discover_members: 'સભ્યો',
    discover_countries: 'દેશો',
    discover_nearby: 'નજીક',
    discover_search_radius: 'શોધ ત્રિજ્યા',
    discover_people_grid: 'શોધો',
    discover_no_users: 'નજીક કોઈ સભ્ય મળ્યા નથી',
    discover_connect: 'જોડાઓ',
    discover_connected: 'જોડાઈ ગયા',
    discover_directory: 'વ્યાપાર નિર્દેશિકા',
    discover_directory_sub: 'ગુજરાતી-માલિકીના વ્યવસાયો શોધો',

    // Community screen
    community_title: 'સમુદાય',
    community_share_placeholder: 'સમુદાય સાથે કંઈક શેર કરો...',
    community_trending: 'ટ્રેન્ડિંગ',
    community_no_posts: 'હજુ સુધી કોઈ પોસ્ટ નથી.',
    community_like: 'પસંદ',
    community_comment: 'ટિપ્પણી',
    community_share: 'શેર',
    community_comments_title: 'ટિપ્પણીઓ',
    community_no_comments: 'હજુ સુધી કોઈ ટિપ્પણી નથી. વાત શરૂ કરો!',
    community_comment_placeholder: 'ટિપ્પણી લખો...',

    // Compose screen
    compose_placeholder: 'તમારા સમુદાયમાં શું ચાલે છે?',

    // Events screen
    events_title: 'કાર્યક્રમો',
    events_filter_all: 'બધા કાર્યક્રમો',
    events_filter_month: 'આ મહિને',
    events_filter_near: 'નજીક',
    events_going: 'જઈ રહ્યા છે',
    events_interested: 'રસ છે',
    events_no_events: 'કોઈ કાર્યક્રમ મળ્યો નથી',
    events_no_events_sub: 'પ્રથમ બનો!',
    events_going_count: 'જઈ રહ્યા છે',
    events_detail_about: 'આ કાર્યક્રમ વિશે',
    events_detail_organizer: 'આયોજક',
    events_detail_attendees: 'કોણ જઈ રહ્યું છે',
    events_detail_date: 'તારીખ',
    events_detail_time: 'સમય',
    events_detail_location: 'સ્થળ',
    events_detail_capacity: 'ક્ષમતા',
    events_rsvp: 'જઈ રહ્યા છે',
    events_rsvp_going: 'તમે જઈ રહ્યા છો!',

    // Profile screen
    profile_connections: 'જોડાણો',
    profile_communities: 'સમુદાયો',
    profile_followers: 'અનુયાયીઓ',
    profile_origin: 'મૂળ અને ઓળખ',
    profile_professional: 'વ્યવસાયિક',
    profile_skills: 'કૌશલ્ય અને રુચિ',
    profile_edit: 'પ્રોફાઇલ સુધારો',
    profile_requests: 'જોડાણ વિનંતીઓ',
    profile_accept: 'સ્વીકારો',
    profile_reject: 'નકારો',
    profile_network: 'મારું નેટવર્ક',
    profile_message: 'સંદેશ',

    // Settings
    settings_title: 'સેટિંગ્સ',
    settings_language: 'ભાષા',
    settings_notifications: 'સૂચનાઓ',
    settings_new_connections: 'નવા જોડાણો',
    settings_messages: 'સંદેશાઓ',
    settings_events: 'કાર્યક્રમો',
    settings_logout: 'લૉગ આઉટ',
    settings_logout_confirm: 'શું તમે ખરેખર લૉગ આઉટ કરવા માંગો છો?',
    settings_cancel: 'રદ કરો',

    // Common
    common_save: 'સાચવો',
    common_cancel: 'રદ',
    common_post: 'પોસ્ટ',
    common_publish: 'પ્રકાશિત',
    common_close: 'બંધ',
    common_free: 'મફત',
    common_verified: 'ચકાસાયેલ',
    common_loading: 'લોડ...',
    common_no_data: 'ડેટા ઉપલબ્ધ નથી',
  },
};

export default translations;
