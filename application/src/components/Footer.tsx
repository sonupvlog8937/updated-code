import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Linking,
  Share,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../hooks/useAppContext';
import { showToast } from '../utils/toast';
import {
  Ionicons,
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

// ─── Contact Info (kept in sync with ContactScreen) ────────────────
const CONTACT_INFO = {
  email: 'sonupvlog8937@gmail.com',
  phone: '+91 8969737537',
  whatsapp: '+91 8969737537',
  address: 'Paibigha, Makhdumpur, Jehnabad, Bihar 804424, India',
  website: 'https://zeedaddy.in',
  businessHours: 'Mon - Sat: 9:00 AM - 6:00 PM',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 20, // clearance so bottom tab bar never overlaps footer content
  },
  trustBar: {
    paddingVertical: 16,
  },
  trustBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    marginBottom: 8,
  },
  trustItemIcon: {
    fontSize: 28,
    marginRight: 12,
    color: '#fff',
  },
  trustItemText: {},
  trustItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  trustItemSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },

  // Main footer body
  footerBody: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },
  brandSection: {
    marginBottom: 24,
  },
  brandLogo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  brandLogoSpan: {
    color: '#ff6b00',
  },
  brandTagline: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#888888',
    marginBottom: 14,
  },
  brandDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: '#555555',
    marginBottom: 18,
  },

  // ── Contact Card block (enhanced) ──
  contactCard: {
    backgroundColor: '#fff9f5',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.14)',
    borderRadius: 14,
    padding: 14,
  },
  contactCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#ff6b00',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactRowLast: {
    marginBottom: 0,
  },
  contactIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ff6b00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactTextWrap: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  contactValuePhone: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff6b00',
  },

  // Navigation columns
  navCol: {
    marginBottom: 28,
  },
  navColTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.75,
    textTransform: 'uppercase',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,0,0.12)',
  },
  navList: {},
  navLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  navLink: {
    fontSize: 13,
    color: '#555555',
    marginRight: 6,
  },
  badge: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    textTransform: 'uppercase',
  },
  badgeNew: {
    backgroundColor: '#ff6b00',
    color: '#fff',
  },
  badgeHot: {
    backgroundColor: '#ff6b00',
    color: '#fff',
  },

  // Newsletter
  newsletter: {
    marginBottom: 28,
  },
  newsletterTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.75,
    textTransform: 'uppercase',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,0,0.12)',
  },
  newsletterDesc: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 19,
    marginBottom: 16,
  },
  newsletterForm: {},
  inputWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.2)',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 13,
    color: '#1a1a1a',
  },
  subBtn: {
    position: 'absolute',
    right: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ff6b00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 11,
    color: '#ff6b00',
    marginTop: 8,
  },
  checkboxLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#ff6b00',
    borderColor: '#ff6b00',
  },
  checkboxLabel_text: {
    fontSize: 11,
    color: '#888888',
  },
  subSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(63,185,80,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(63,185,80,0.2)',
    borderRadius: 6,
  },
  subSuccessText: {
    fontSize: 13,
    color: '#3fb950',
    fontWeight: '500',
    marginLeft: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  trustBadgeText: {
    fontSize: 11,
    color: '#888888',
    marginLeft: 6,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,107,0,0.12)',
    marginTop: 22,
    marginBottom: 22,
  },

  // App Download
  appDownload: {
    marginBottom: 28,
  },
  appTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.75,
    textTransform: 'uppercase',
    color: '#1a1a1a',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,0,0.12)',
  },
  appStoreBtns: {
    flexDirection: 'row',
    marginTop: 8,
  },
  appBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  appBtnLast: {
    marginRight: 0,
  },
  appBtnIcon: {
    color: '#fff',
    fontSize: 24,
    marginRight: 8,
  },
  appBtnTextSmall: {
    color: '#fff',
    fontSize: 8,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  appBtnTextLarge: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Bottom section
  footerBottom: {
    backgroundColor: '#fff4ee',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,0,0.12)',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  footerBottomContent: {},
  social: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  socialLink: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  copyright: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  copyrightText: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 6,
  },
  payments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  payChip: {
    backgroundColor: '#fff4ee',
    borderWidth: 1,
    borderColor: 'rgba(255,107,0,0.15)',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  payChipText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
});

interface TrustItem {
  icon: string;
  title: string;
  sub: string;
}

const TrustBar: React.FC = () => {
  const trustItems: TrustItem[] = [
    { icon: 'truck-fast', title: 'Free Shipping', sub: 'Orders over ₹100' },
    { icon: 'undo', title: '30 Days Returns', sub: 'Hassle-free exchange' },
    { icon: 'lock-check', title: 'Secure Payment', sub: '100% protected' },
    { icon: 'gift-open', title: 'Special Gifts', sub: 'On your first order' },
    { icon: 'headphones', title: '24/7 Support', sub: 'Always here for you' },
  ];

  return (
    <LinearGradient
      colors={['#FF8F5E', '#FF6B2B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.trustBar}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trustBarContent}
      >
        {trustItems.map((item) => (
          <View key={item.title} style={styles.trustItem}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={28}
              color="#fff"
              style={styles.trustItemIcon}
            />
            <View style={styles.trustItemText}>
              <Text style={styles.trustItemTitle}>{item.title}</Text>
              <Text style={styles.trustItemSub}>{item.sub}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

interface NavLink {
  label: string;
  route?: string;
  action?: () => void;
}

const Footer: React.FC = () => {
  const navigation = useNavigation<any>();
  const context = useAppContext() as any;
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState('');

  const handleNavigation = useCallback(
    (route: string) => {
      try {
        navigation.navigate(route);
      } catch (error) {
        console.error(`Navigation to ${route} failed:`, error);
      }
    },
    [navigation]
  );

  const handleEmail = () => {
    Linking.openURL(`mailto:${CONTACT_INFO.email}`).catch(() =>
      showToast('error', '❌ Could not open email app')
    );
  };

  const handlePhone = () => {
    Linking.openURL(`tel:${CONTACT_INFO.phone}`).catch(() =>
      showToast('error', '❌ Could not open phone app')
    );
  };

  const handleWhatsApp = () => {
    const message = 'Hi Zeedaddy, I need support with...';
    const whatsappNumber = CONTACT_INFO.whatsapp.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() =>
      showToast('error', '❌ WhatsApp is not installed')
    );
  };

  const handleWebsite = () => {
    Linking.openURL(CONTACT_INFO.website).catch(() =>
      showToast('error', '❌ Could not open website')
    );
  };

  const handleAddress = () => {
    const addressEncoded = encodeURIComponent(CONTACT_INFO.address);
    const url = `https://www.google.com/maps/search/${addressEncoded}`;
    Linking.openURL(url).catch(() =>
      showToast('error', '❌ Could not open maps')
    );
  };

  const handleSubscribe = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setSubError('Please enter a valid email address.');
      return;
    }
    if (!agreed) {
      setSubError('Please agree to the terms first.');
      return;
    }
    setSubError('');
    setSubscribed(true);
    console.log('Subscribing email:', email);
  };

  const handlePlayStoreReview = () => {
    // market:// deep link seedha Play Store app ke review/rating section pe le jata hai
    const marketUrl = `https://play.google.com/store/apps/details?id=com.zeedaddy.app`;
    const webUrl = `https://play.google.com/store/apps/details?id=com.zeedaddy.app`;
    Linking.openURL(marketUrl).catch(() => {
      Linking.openURL(webUrl).catch(() =>
        showToast('error', '❌ Could not open Play Store')
      );
    });
  };

  const handleAppStoreReview = () => {
    // action=write-review query App Store ko seedha review/rating screen pe le jati hai
    const url = `https://play.google.com/store/apps/details?id=com.zeedaddy.app`;
    Linking.openURL(url).catch(() =>
      showToast('error', '❌ Could not open App Store')
    );
  };

  const productLinks: NavLink[] = [
    { label: 'Prices drop', route: 'products' },
    { label: 'New products', route: 'products' },
    { label: 'Best sales', route: 'products' },
    { label: 'Contact us', route: 'search' },
    { label: 'Sitemap', route: 'search' },
    { label: 'Stores', route: 'search' },
  ];

  const companyLinks: NavLink[] = [
    { label: 'Delivery', route: 'search' },
    { label: 'Legal Notice', route: 'privacy-policy' },
    { label: 'Terms & Conditions', route: 'privacy-policy' },
    { label: 'About us', route: 'search' },
    { label: 'Secure payment', route: 'search' },
    { label: 'Login', route: 'login' },
  ];

  const socialLinks = [
    { icon: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/share/18omUEzwUR/' },
    { icon: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/zeedaddy15?utm_source=qr&igsh=MXFvZnRyemk2bXJxNA==' },
    { icon: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@zeedaddy' },
    { icon: 'twitter', label: 'X', url: 'https://x.com/zeedaddy15' },
    { icon: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/zee-daddy-046732392?utm_source=share_via&utm_content=profile&utm_medium=member_android' },
  ];

  const paymentMethods = ['Visa', 'Mastercard', 'PayPal', 'Amex', 'UPI', 'RuPay'];

  const handleSocialPress = useCallback((url: string, label: string) => {
    Linking.openURL(url).catch(() => {
      Share.share({
        message: `Follow us on ${label} - Zeedaddy Online Shopping`,
        title: `Zeedaddy on ${label}`,
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Trust Bar */}
      <TrustBar />

      {/* Main Footer Body */}
      <View style={styles.footerBody}>
        {/* Brand Section */}
        <View style={styles.brandSection}>
          <Text style={styles.brandLogo}>
            Zee<Text style={styles.brandLogoSpan}>daddy</Text>
          </Text>
          <Text style={styles.brandTagline}>Mega Super Store · Est. 2026</Text>
          <Text style={styles.brandDesc}>
            Bihar's premier destination for quality products at unbeatable prices. Serving over 5,000 happy customers
            across India.
          </Text>

          {/* Enhanced Contact Card */}
          <View style={styles.contactCard}>
            <Text style={styles.contactCardTitle}>Get in Touch</Text>

            <TouchableOpacity style={styles.contactRow} onPress={handleAddress} activeOpacity={0.7}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="location" size={16} color="#fff" />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactValue}>{CONTACT_INFO.address}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={handlePhone} activeOpacity={0.7}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="call" size={16} color="#fff" />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactLabel}>Call Us</Text>
                <Text style={styles.contactValuePhone}>{CONTACT_INFO.phone}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={handleWhatsApp} activeOpacity={0.7}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="logo-whatsapp" size={16} color="#fff" />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>{CONTACT_INFO.whatsapp}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={handleEmail} activeOpacity={0.7}>
              <View style={styles.contactIconCircle}>
                <MaterialCommunityIcons name="email" size={16} color="#fff" />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{CONTACT_INFO.email}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={handleWebsite} activeOpacity={0.7}>
              <View style={styles.contactIconCircle}>
                <MaterialCommunityIcons name="web" size={16} color="#fff" />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>{CONTACT_INFO.website}</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.contactRow, styles.contactRowLast]}>
              <View style={styles.contactIconCircle}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#fff" />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactLabel}>Business Hours</Text>
                <Text style={styles.contactValue}>{CONTACT_INFO.businessHours}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Products Section */}
        <View style={styles.navCol}>
          <Text style={styles.navColTitle}>Products</Text>
          <View style={styles.navList}>
            {productLinks.map((link, idx) => (
              <TouchableOpacity
                key={`${link.label}-${idx}`}
                onPress={() => link.route && handleNavigation(link.route)}
              >
                <View style={styles.navLinkRow}>
                  <Text style={styles.navLink}>{link.label}</Text>
                  {idx === 1 && <Text style={[styles.badge, styles.badgeNew]}>NEW</Text>}
                  {idx === 2 && <Text style={[styles.badge, styles.badgeHot]}>HOT</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Company Section */}
        <View style={styles.navCol}>
          <Text style={styles.navColTitle}>Our Company</Text>
          <View style={styles.navList}>
            {companyLinks.map((link, idx) => (
              <TouchableOpacity
                key={`${link.label}-${idx}`}
                onPress={() => link.route && handleNavigation(link.route)}
              >
                <View style={styles.navLinkRow}>
                  <Text style={styles.navLink}>{link.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Download Section */}
        {/* <View style={styles.appDownload}>
          <Text style={styles.appTitle}>Download Our App</Text>
          <Text style={styles.newsletterDesc}>
            Shop on the go with the Zeedaddy app. Fast, secure, and packed with exclusive mobile-only deals!
          </Text>
          <View style={styles.appStoreBtns}>
            <TouchableOpacity style={styles.appBtn} activeOpacity={0.8}>
              <FontAwesome5 name="google-play" style={styles.appBtnIcon} />
              <View>
                <Text style={styles.appBtnTextSmall}>GET IT ON</Text>
                <Text style={styles.appBtnTextLarge}>Google Play</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.appBtn, styles.appBtnLast]} activeOpacity={0.8}>
              <FontAwesome5 name="apple" style={styles.appBtnIcon} />
              <View>
                <Text style={styles.appBtnTextSmall}>Download on the</Text>
                <Text style={styles.appBtnTextLarge}>App Store</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View> */}

        <View style={styles.appDownload}>
          <Text style={styles.appTitle}>Download Our App</Text>
          <Text style={styles.newsletterDesc}>
            Shop on the go with the Zeedaddy app. Fast, secure, and packed with exclusive mobile-only deals!
          </Text>
          <View style={styles.appStoreBtns}>
            <TouchableOpacity style={styles.appBtn} activeOpacity={0.8} onPress={handlePlayStoreReview}>
              <FontAwesome5 name="google-play" style={styles.appBtnIcon} />
              <View>
                <Text style={styles.appBtnTextSmall}>RATE US ON</Text>
                <Text style={styles.appBtnTextLarge}>Google Play</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.appBtn, styles.appBtnLast]} activeOpacity={0.8} onPress={handleAppStoreReview}>
              <FontAwesome5 name="apple" style={styles.appBtnIcon} />
              <View>
                <Text style={styles.appBtnTextSmall}>RATE US ON</Text>
                <Text style={styles.appBtnTextLarge}>App Store</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Newsletter Section */}
        <View style={styles.newsletter}>
          <Text style={styles.newsletterTitle}>Newsletter</Text>
          <Text style={styles.newsletterDesc}>
            Get early access to deals, exclusive offers, and new arrivals — straight to your inbox.
          </Text>

          {subscribed ? (
            <View style={styles.subSuccess}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#3fb950" />
              <Text style={styles.subSuccessText}>You're subscribed! Watch your inbox.</Text>
            </View>
          ) : (
            <View style={styles.newsletterForm}>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Your email address"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setSubError('');
                  }}
                  keyboardType="email-address"
                />
                <TouchableOpacity style={styles.subBtn} onPress={handleSubscribe}>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              {subError ? <Text style={styles.errorText}>{subError}</Text> : null}

              <TouchableOpacity style={styles.checkboxLabel} onPress={() => setAgreed(!agreed)}>
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel_text}>I agree to the terms and privacy policy</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Trust Badge */}
          <View style={styles.trustBadge}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#3fb950" />
            <Text style={styles.trustBadgeText}>SSL Secured & DPDP Compliant</Text>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.footerBottom}>
        <View style={styles.footerBottomContent}>
          {/* Social Links */}
          <View style={styles.social}>
            {socialLinks.map((link) => (
              <TouchableOpacity
                key={link.label}
                style={styles.socialLink}
                onPress={() => handleSocialPress(link.url, link.label)}
              >
                <FontAwesome name={link.icon as any} size={14} color="#555" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Copyright */}
          <View style={styles.copyright}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#ff6b00" />
            <Text style={styles.copyrightText}>© 2026 Zeedaddy Online Shopping. All rights reserved.</Text>
          </View>

          {/* Payment Methods */}
          <View style={styles.payments}>
            {paymentMethods.map((method) => (
              <View key={method} style={styles.payChip}>
                <Text style={styles.payChipText}>{method}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default Footer;