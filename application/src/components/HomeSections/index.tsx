import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { FAQ, Review } from '../../types';

// ─── Benefits Section ─────────────────────────────────────────
const BENEFITS = [
  { icon: '🚚', title: 'Free Shipping', sub: 'On orders above ₹200' },
  { icon: '🔄', title: 'Easy Returns', sub: '7-day return policy' },
  { icon: '🔒', title: 'Secure Payment', sub: '100% safe & secure' },
  { icon: '🎧', title: '24/7 Support', sub: 'Always here to help' },
];

export const BenefitsSection: React.FC = () => (
  <View style={bStyles.section}>
    <View style={bStyles.grid}>
      {BENEFITS.map((b, i) => (
        <View key={i} style={bStyles.card}>
          <Text style={bStyles.icon}>{b.icon}</Text>
          <Text style={bStyles.title}>{b.title}</Text>
          <Text style={bStyles.sub}>{b.sub}</Text>
        </View>
      ))}
    </View>
  </View>
);

const bStyles = StyleSheet.create({
  section: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#ffedd5',
    alignItems: 'flex-start',
    gap: 4,
    shadowColor: '#FF6B2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: { fontSize: 26, marginBottom: 4 },
  title: { fontSize: 13, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 11, color: '#6B7280', lineHeight: 15 },
});


// ─── Reviews Section ──────────────────────────────────────────
const REVIEWS: Review[] = [
  { text: 'Amazing quality and super fast delivery. Will definitely order again!', author: 'Priya S.', location: 'Mumbai', avatar: 'P', rating: 5 },
  { text: 'Packaging was premium and product exactly as shown. No surprises!', author: 'Rahul M.', location: 'Delhi', avatar: 'R', rating: 5 },
  { text: 'Customer support resolved my issue in under 10 minutes. 5 stars!', author: 'Anita K.', location: 'Bangalore', avatar: 'A', rating: 5 },
];

export const ReviewsSection: React.FC = () => (
  <View style={rStyles.section}>
    <View style={rStyles.box}>
      <Text style={rStyles.heading}>What Our Customers Say</Text>
      <View style={rStyles.cards}>
        {REVIEWS.map((r, i) => (
          <View key={i} style={rStyles.card}>
            <View style={rStyles.stars}>
              {[...Array(r.rating)].map((_, j) => (
                <Text key={j} style={rStyles.star}>★</Text>
              ))}
            </View>
            <Text style={rStyles.text}>"{r.text}"</Text>
            <View style={rStyles.authorRow}>
              <View style={rStyles.avatar}>
                <Text style={rStyles.avatarText}>{r.avatar}</Text>
              </View>
              <View>
                <Text style={rStyles.name}>{r.author}</Text>
                <Text style={rStyles.location}>{r.location}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  </View>
);

const rStyles = StyleSheet.create({
  section: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  box: {
    backgroundColor: '#FFF8F4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,43,0.12)',
  },
  heading: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 14 },
  cards: { gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,43,0.1)',
    shadowColor: '#FF6B2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stars: { flexDirection: 'row', gap: 2, marginBottom: 8 },
  star: { fontSize: 13, color: '#f59e0b' },
  text: { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FF6B2B', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  name: { fontSize: 12, fontWeight: '700', color: '#111827' },
  location: { fontSize: 10, color: '#9CA3AF' },
});


// ─── Newsletter Section ───────────────────────────────────────
export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const subscribe = useCallback(() => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg('Please enter a valid email address.');
      return;
    }
    setMsg('🎉 You\'re subscribed! Check your inbox for exclusive deals.');
    setEmail('');
  }, [email]);

  return (
    <View style={nStyles.section}>
      <View style={nStyles.card}>
        <View style={nStyles.badge}>
          <Text style={nStyles.badgeText}>Stay updated</Text>
        </View>
        <Text style={nStyles.title}>Exclusive deals, just for you 🎁</Text>
        <Text style={nStyles.sub}>Join our newsletter and never miss a flash sale or drop.</Text>
        <View style={nStyles.row}>
          <TextInput
            style={nStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            placeholderTextColor="rgba(255,255,255,0.6)"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={nStyles.btn} onPress={subscribe}>
            <Text style={nStyles.btnText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
        {msg !== '' && <Text style={nStyles.msg}>{msg}</Text>}
      </View>
    </View>
  );
};

const nStyles = StyleSheet.create({
  section: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  card: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FF6B2B',
    gap: 10,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 26 },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  btn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#FF6B2B', fontWeight: '700', fontSize: 13 },
  msg: { color: '#fff', fontSize: 12, fontWeight: '600' },
});


// ─── FAQ Section ──────────────────────────────────────────────
const FAQS: FAQ[] = [
  { q: 'How fast is shipping?', a: 'Metro cities: 1-2 days, others: 3-5 days with live tracking via SMS & email.' },
  { q: 'Do you offer cash on delivery?', a: 'Yes, COD is available on most pin codes with a nominal handling fee.' },
  { q: 'Can I return a product?', a: 'Yes, easy 7-day returns on eligible products. Start from My Orders page.' },
  { q: 'Are my payments secure?', a: 'Yes. We use industry-standard SSL encryption and trusted payment gateways.' },
];

export const FAQSection: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState(0);

  return (
    <View style={fStyles.section}>
      <Text style={fStyles.heading}>Frequently Asked Questions</Text>
      <Text style={fStyles.sub}>Everything you need to know about shopping with us.</Text>
      <View style={fStyles.list}>
        {FAQS.map((item, i) => (
          <View
            key={i}
            style={[fStyles.item, activeFaq === i && fStyles.itemActive]}
          >
            <TouchableOpacity
              style={fStyles.question}
              onPress={() => setActiveFaq(activeFaq === i ? -1 : i)}
            >
              <Text style={fStyles.questionText}>{item.q}</Text>
              <View style={[fStyles.plusBtn, activeFaq === i && fStyles.plusActive]}>
                <Text style={[fStyles.plus, activeFaq === i && fStyles.plusWhite]}>
                  {activeFaq === i ? '×' : '+'}
                </Text>
              </View>
            </TouchableOpacity>
            {activeFaq === i && (
              <Text style={fStyles.answer}>{item.a}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const fStyles = StyleSheet.create({
  section: { paddingHorizontal: 12, paddingVertical: 16, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 4 },
  sub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  list: { gap: 10 },
  item: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F1F3F5',
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  itemActive: {
    borderColor: 'rgba(255,107,43,0.3)',
    backgroundColor: 'rgba(255,107,43,0.02)',
  },
  question: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  questionText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827', paddingRight: 10 },
  plusBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F1F3F5',
    alignItems: 'center', justifyContent: 'center',
  },
  plusActive: { backgroundColor: '#FF6B2B' },
  plus: { fontSize: 18, color: '#9CA3AF', lineHeight: 22 },
  plusWhite: { color: '#fff' },
  answer: {
    paddingHorizontal: 16, paddingBottom: 14,
    fontSize: 13, color: '#6B7280', lineHeight: 20,
  },
});
