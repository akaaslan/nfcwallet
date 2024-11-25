import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

interface ExpandableCardProps {
  id: number;
  title: string;
  details: string;
  nfcData?: string;
}

const ExpandableCard: React.FC<
  ExpandableCardProps & { onDelete: (id: number) => void }
> = ({ id, title, details, nfcData, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [heightAnim] = useState(new Animated.Value(60));
  const [opacityAnim] = useState(new Animated.Value(1));
  const [modalVisible, setModalVisible] = useState(false);

  const toggleExpand = () => {
    Animated.timing(heightAnim, {
      toValue: expanded ? 60 : 150,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const showModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const confirmDelete = () => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDelete(id);
      closeModal();
    });
  };

  return (
    <Animated.View
      style={[styles.card, { height: heightAnim, opacity: opacityAnim }]}
    >
      <TouchableOpacity onPress={toggleExpand} style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={showModal}>
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.cardDetails}>
          <Text style={styles.cardDetailsText}>{details}</Text>
          {nfcData && (
            <Text style={styles.nfcDataText}>NFC Data: {nfcData}</Text>
          )}
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalContainer} onPress={closeModal}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeModal}
            >
              <Text style={styles.modalCloseButtonText}>X</Text>
            </TouchableOpacity>
            <Text style={styles.modalText}>
              Do you really want to delete this card?
            </Text>
            <TouchableOpacity
              style={styles.modalDeleteButton}
              onPress={confirmDelete}
            >
              <Text style={styles.modalDeleteButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
};

const App: React.FC = () => {
  const [cards, setCards] = useState<ExpandableCardProps[]>([
    { id: 1, title: 'Kart 1', details: 'Bu, birinci kartın detaylarıdır.' },
  ]);
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);

  useEffect(() => {
    const initializeNfc = async () => {
      try {
        const supported = await NfcManager.isSupported();
        if (supported) {
          await NfcManager.start();
          setIsNfcSupported(true);
        } else {
          console.log('NFC not supported');
          setIsNfcSupported(false);
        }
      } catch (ex) {
        console.warn('Error initializing NFC', ex);
        setIsNfcSupported(false);
      }
    };

    initializeNfc();
  }, []);

  const openScanModal = () => {
    if (!isNfcSupported) {
      Alert.alert('NFC Error', 'NFC is not supported on this device');
      return;
    }
    setScanModalVisible(true);
  };

  const scanNfc = async () => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      if (tag) {
        const ndefRecords = tag.ndefMessage;
        const parsedData = ndefRecords && ndefRecords.length > 0
          ? Ndef.text.decodePayload(new Uint8Array(ndefRecords[0].payload))
          : 'No readable data';

        const newCard = {
          title: 'New NFC Card',
          details: 'Card scanned successfully',
          nfcData: parsedData,
        };

        setCards((prev) => [...prev, { ...newCard, id: prev.length + 1 }]);
      }
    } catch (ex) {
      console.warn('NFC Scan Error', ex);
      Alert.alert('NFC Error', 'Failed to scan NFC tag');
    } finally {
      NfcManager.cancelTechnologyRequest();
      setScanModalVisible(false);
    }
  };

  const deleteCard = (id: number) => {
    setCards(cards.filter((card) => card.id !== id));
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        keyExtractor={(item) => `${item.id}`}
        renderItem={({ item }) => (
          <ExpandableCard
            id={item.id}
            title={item.title}
            details={item.details}
            nfcData={item.nfcData}
            onDelete={deleteCard}
          />
        )}
        ListFooterComponent={
          <TouchableOpacity onPress={openScanModal} style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
    padding: 20,
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    backgroundColor: 'rgba(100,100,100,1)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 2, height: 5 },
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardDetails: {
    padding: 20,
  },
  cardDetailsText: {
    fontSize: 16,
    color: '#555',
  },
  nfcDataText: {
    fontSize: 14,
    color: '#007bff',
    marginTop: 10,
  },
  addButton: {
    backgroundColor: 'rgba(100,100,100,1)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: 50,
    height: 50,
    marginVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 2, height: 5 },
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  scanModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  scanModalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#752020',
    fontWeight: 'bold',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalCloseButton: {
    backgroundColor: '#752020',
    borderRadius: 25,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 18,
    color: '#333',
    marginVertical: 20,
    textAlign: 'center',
  },
  modalDeleteButton: {
    backgroundColor: '#752020',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalDeleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default App;