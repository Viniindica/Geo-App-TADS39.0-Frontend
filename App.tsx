import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, FlatList, Image, Alert, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'http://192.168.1.106:8080';

type Place = {
  _id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  photo?: string | null;
  createdAt?: string;
};

export default function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await fetch(`${API_URL}/api/places`);
      const data = await res.json();
      setPlaces(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os registros');
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o acesso à localização.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o uso da câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        const base64Img = `data:image/jpeg;base64,${asset.base64}`;
        setPhoto(base64Img);
      } else if (asset.uri) {
        setPhoto(asset.uri);
      }
    }
  };

  const handleSave = async () => {
    if (!title || !description || latitude == null || longitude == null) {
      Alert.alert('Campos obrigatórios', 'Preencha título, descrição e localização.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          latitude,
          longitude,
          photo,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro ao salvar', errorData);
        Alert.alert('Erro', 'Falha ao salvar o registro.');
        return;
      }

      const created = await res.json();
      setPlaces((prev) => [created, ...prev]);
      setTitle('');
      setDescription('');
      setLatitude(null);
      setLongitude(null);
      setPhoto(null);
      Alert.alert('Sucesso', 'Registro salvo com sucesso!');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha na conexão com o backend.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Place }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.createdAt && (
          <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleString()}</Text>
        )}
      </View>
      <Text style={styles.cardDescription}>{item.description}</Text>
      <View style={styles.coordsContainer}>
        <Text style={styles.cardCoords}>
          🌍 Lat: {item.latitude.toFixed(5)} | Lng: {item.longitude.toFixed(5)}
        </Text>
      </View>
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.cardImage} />
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <FlatList
        data={places}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.formContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Cadastro de Ponto</Text>
              <Text style={styles.subtitle}>Foto e Localização</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o título"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Digite a descrição"
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                returnKeyType="default"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Localização</Text>
              <TouchableOpacity style={styles.psButton} onPress={getLocation}>
                <Text style={styles.buttonText}>Obter Localização Atual</Text>
              </TouchableOpacity>
              <View style={styles.coordsContainer}>
                <Text style={styles.coordsText}>Latitude: {latitude ?? '--'}</Text>
                <Text style={styles.coordsText}>Longitude: {longitude ?? '--'}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📷 Foto</Text>
              <TouchableOpacity style={styles.psButtonSecondary} onPress={takePhoto}>
                <Text style={styles.buttonTextSecondary}>Tirar Foto</Text>
              </TouchableOpacity>
              {photo && <Image source={{ uri: photo }} style={styles.previewImage} />}
            </View>

            <TouchableOpacity 
              style={[styles.psButton, loading && styles.buttonDisabled]} 
              onPress={handleSave} 
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '⏳ Salvando...' : '💾 Salvar Registro'}
              </Text>
            </TouchableOpacity>

            {/* Header da Lista */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Registros Cadastrados</Text>
              <Text style={styles.listSubtitle}>{places.length} itens</Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        stickyHeaderIndices={[]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003087',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003087',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#e1e5ee',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 100,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e1e5ee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003087',
    marginBottom: 12,
  },
  psButton: {
    backgroundColor: '#003087',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#003087',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  psButtonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#003087',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#003087',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
  },
  coordsContainer: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  coordsText: {
    fontSize: 14,
    color: '#003087',
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#e1e5ee',
  },
  listContent: {
    paddingBottom: 30,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 0,
    backgroundColor: '#f8f9fa',
    marginTop: 10,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003087',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e1e5ee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003087',
    flex: 1,
    marginRight: 12,
  },
  cardDescription: {
    fontSize: 15,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardCoords: {
    fontSize: 13,
    color: '#003087',
    fontWeight: '500',
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e1e5ee',
  },
  cardDate: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
});