//@flow

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
} from 'react-native';

import {Base64} from 'js-base64';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {BleManager, Device} from 'react-native-ble-plx';

const temperatureServiceUUID: string = 'e95d6100-251d-470a-a062-fa1922dfa9a8';
const temperatureCharacteristicUUID: string =
  'e95d9250-251d-470a-a062-fa1922dfa9a8';

const App = () => {
  const manager = new BleManager();
  const [device, setDevice] = useState(new Device());
  const [temperatureArray, setTemperatureArray] = useState<Array<Number>>([]);

  const scanAndConnect = async () => {
    // Attempt to retrieve a stored UUID from a previous session,
    // and if successful, connect to that device and update the
    // state with it.
    const storedId = await AsyncStorage.getItem('microBitId');
    if (storedId) {
      console.log('found previous device');
      setDevice(await manager.connectToDevice(storedId));
      return;
    }

    // If there was no stored ID, start the device search and
    // provide it with a callback that, on finding a device with
    // a name containing "micro:bit", stops scanning, updates the
    // state and saves the ID for future reference.
    manager.startDeviceScan(null, null, async (error, tempDevice) => {
      if (error) {
        console.log('error: ', error);
        return;
      }
      console.log('device: ', tempDevice.name);
      if (tempDevice?.name?.includes('micro:bit')) {
        manager.stopDeviceScan();
        AsyncStorage.setItem('microBitID', tempDevice.id);
        setDevice(tempDevice);
      }
    });
  };

  const postConnect = async () => {
    await device.discoverAllServicesAndCharacteristics();
    const chars = await device.readCharacteristicForService(
      temperatureServiceUUID,
      temperatureCharacteristicUUID,
    );
    const val = Base64.toUint8Array(chars.value);
    chars.monitor((error, char) => {
      if (error) {
        return;
      }
    });
    console.log('temperature', Base64.toUint8Array(chars.value)[0]);
  };

  useEffect(() => {
    const subscription = manager.onStateChange((state) => {
      console.log(state);
      if (state === 'PoweredOn') {
        scanAndConnect();
        subscription.remove();
      }
    }, true);
  }, []);

  useEffect(() => {
    if (device.id) {
      device
        .connect()
        .then(() => postConnect())
        .catch((e) => console.log(e));
    }
  }, [device]);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Button title="Other" onPress={() => postConnect()} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
