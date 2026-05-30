import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Category, RootStackParamList } from '../../types';

interface Props {
  data: Category[];
}

const HomeCatSlider: React.FC<Props> = ({ data }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('products' as any, { catId: item._id })}
          >
            <View style={styles.imgWrapper}>
              <Image
                source={{ uri: item.images?.[0] }}
                style={styles.img}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#F1F3F5',
    paddingVertical: 10,
  },
  list: {
    paddingHorizontal: 12,
    gap: 8,
  },
  item: {
    alignItems: 'center',
    width: 72,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  imgWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 6,
  },
  img: {
    width: 36,
    height: 36,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default HomeCatSlider;
