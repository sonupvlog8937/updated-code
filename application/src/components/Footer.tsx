import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Linking,
  Share,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../hooks/useAppContext';
import { showToast } from '../utils/toast';
import {
  Ionicons,
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginTop: 40,
  },
  trustBar: {
    backgroundColor: '#ff6b00',
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
  trustItemText: {
    gap: 2,
  },
  trustItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trustItemSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },

  // Main footer body
  footerBody: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    backgroundColor: '#ffffff',
  },
  brandSection: {
    marginBottom: 32,
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
    marginBottom: 16,
  },
  brandDesc: {
    fontSize: 13,
    lineHeight: 1.7,
    color: '#555555',
    marginBottom: 20,
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  contactIcon: {
    fontSize: 16,
    color: '#ff6b00',
    marginTop: 2,
  },
  contactText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 1.5,
    flex: 1,
  },
  contactLink: {
    color: '#555555',
  },
  contactLinkHover: {
    color: '#ff6b00',
  },
  phoneText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff6b00',
    letterSpacing: -0.5,
  },

  // Navigation columns
  navCol: {
    marginBottom: 32,
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
  navList: {
    gap: 10,
  },
  navLink: {
    fontSize: 13,
    color: '#555555',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navLinkText: {
    color: '#555555',
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
    marginBottom: 32,
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
    lineHeight: 1.6,
    marginBottom: 16,
  },
  newsletterForm: {
    gap: 10,
  },
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
    gap: 8,
    marginTop: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#888888',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 8,
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
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  trustBadgeIcon: {
    fontSize: 16,
    color: '#3fb950',
  },
  trustBadgeText: {
    fontSize: 11,
    color: '#888888',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,107,0,0.12)',
    marginTop: 24,
    marginBottom: 24,
  },

  // Bottom section
  footerBottom: {
    backgroundColor: '#fff4ee',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,107,0,0.12)',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  footerBottomContent: {
    gap: 16,
  },
  social: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  socialLink: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyright: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#888888',
  },
  payments: {
    flexDirection: 'row',
    gap: 6,
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
  },
  payChipText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  trustBarScroll: {
    paddingVertical: 10,
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
    <View style={styles.trustBar}>
      <View style={styles.trustBarContent}>
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
      </View>
    </View>
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
    { icon: 'facebook', label: 'Facebook', url: 'https://facebook.com' },
    { icon: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
    { icon: 'youtube', label: 'YouTube', url: 'https://youtube.com' },
    { icon: 'twitter', label: 'Twitter', url: 'https://twitter.com' },
    { icon: 'pinterest', label: 'Pinterest', url: 'https://pinterest.com' },
    { icon: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com' },
  ];

  const paymentMethods = ['Visa', 'Mastercard', 'PayPal', 'Amex', 'UPI', 'RuPay'];

  const handleSocialPress = useCallback(
    (url: string, label: string) => {
      Linking.openURL(url).catch(() => {
        Share.share({
          message: `Follow us on ${label} - Zeedaddy Online Shopping`,
          title: `Zeedaddy on ${label}`,
        });
      });
    },
    []
  );

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
          <Text style={styles.brandTagline}>Mega Super Store · Est. 2020</Text>
          <Text style={styles.brandDesc}>
            Bihar's premier destination for quality products at unbeatable prices. Serving over 50,000 happy customers
            across India.
          </Text>

          {/* Contact Info */}
          <View style={styles.contactList}>
            {/* Location */}
            <View style={styles.contactItem}>
              <Ionicons
                name="location"
                size={16}
                color="#ff6b00"
                style={styles.contactIcon}
              />
              <Text style={styles.contactText}>Makhdumpur, Jehanabad, Bihar, India – 804424</Text>
            </View>

            {/* Email */}
            <View style={styles.contactItem}>
              <MaterialCommunityIcons
                name="email"
                size={16}
                color="#ff6b00"
                style={styles.contactIcon}
              />
              <TouchableOpacity onPress={() => Linking.openURL('mailto:sonuee15@gmail.com')}>
                <Text style={[styles.contactText, styles.contactLink]}>sonuee15@gmail.com</Text>
              </TouchableOpacity>
            </View>

            {/* Phone */}
            <View style={styles.contactItem}>
              <Ionicons
                name="call"
                size={16}
                color="#ff6b00"
                style={styles.contactIcon}
              />
              <TouchableOpacity onPress={() => Linking.openURL('tel:+918969737537')}>
                <Text style={[styles.contactText, styles.phoneText]}>(+91) 89697 37537</Text>
              </TouchableOpacity>
            </View>

            {/* Live Chat */}
            <View style={styles.contactItem}>
              <Ionicons
                name="chatbubble"
                size={16}
                color="#ff6b00"
                style={styles.contactIcon}
              />
              <TouchableOpacity onPress={() => handleNavigation('search')}>
                <Text style={styles.contactText}>
                  Live Chat – <Text style={styles.contactLink}>Start a conversation</Text>
                </Text>
              </TouchableOpacity>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={10}
                    color="#ff6b00"
                    style={{ opacity: 0 }}
                  />
                  <Text style={styles.navLink}>{link.label}</Text>
                  {idx === 1 && (
                    <Text style={[styles.badge, styles.badgeNew]}>
                      NEW
                    </Text>
                  )}
                  {idx === 2 && (
                    <Text style={[styles.badge, styles.badgeHot]}>
                      HOT
                    </Text>
                  )}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={10}
                    color="#ff6b00"
                    style={{ opacity: 0 }}
                  />
                  <Text style={styles.navLink}>{link.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color="#3fb950"
              />
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
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={16}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>

              {subError ? <Text style={styles.errorText}>{subError}</Text> : null}

              <TouchableOpacity
                style={styles.checkboxLabel}
                onPress={() => setAgreed(!agreed)}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && (
                    <MaterialCommunityIcons
                      name="check"
                      size={12}
                      color="#fff"
                    />
                  )}
                </View>
                <Text style={styles.checkboxLabel_text}>I agree to the terms and privacy policy</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Trust Badge */}
          <View style={styles.trustBadge}>
            <MaterialCommunityIcons
              name="shield-check"
              size={16}
              color="#3fb950"
            />
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
                <FontAwesome
                  name={link.icon as any}
                  size={14}
                  color="#555"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Copyright */}
          <View style={styles.copyright}>
            <MaterialCommunityIcons
              name="shield-check"
              size={14}
              color="#ff6b00"
            />
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
