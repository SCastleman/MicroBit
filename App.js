//@flow

import React, {useEffect, useState} from 'react';
import {StyleSheet, ScrollView, View, StatusBar} from 'react-native';

import {Base64} from 'js-base64';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {BleManager, Device} from 'react-native-ble-plx';

import CollectionCell from './CollectionCell';

import Icon from 'react-native-vector-icons/FontAwesome';

import style from './style.js';

const temperatureServiceUUID: string = 'e95d6100-251d-470a-a062-fa1922dfa9a8';
const temperatureCharacteristicUUID: string =
  'e95d9250-251d-470a-a062-fa1922dfa9a8';
const temperaturePeriodUUID: string = 'e95d1b25-251d-470a-a062-fa1922dfa9a8';

type dataContainer = {
  timeStamp: Number,
  temperature: Number,
};

const App = () => {
  const manager = new BleManager();
  const [device, setDevice] = useState(new Device());
  const [temperatureArray, setTemperatureArray] = useState<
    Array<dataContainer>,
  >([]);
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      if (error) {
        console.log('error: ', error);
        setLoading(false);
        return;
      }
      console.log('device: ', tempDevice.name);
      if (tempDevice?.name?.includes('micro:bit')) {
        manager.stopDeviceScan();
        manager.onDeviceDisconnected(tempDevice.id, (error, Device) => {
          setDevice(new Device());
          // Send push notification here
        });
        AsyncStorage.setItem('microBitID', tempDevice.id);
        setDevice(tempDevice);
        setLoading(false);
      }
    });
  };

  // Here we perform the discovery of all services and characteristics
  // offered by the Micro:Bit, then get the temperature characteristic
  // and provide the monitor with a callback function that will append
  // the current temperature to the temperatures array once every
  // polling interval.
  const postConnect = async () => {
    await device.discoverAllServicesAndCharacteristics();
    const temperatureChar = await device.readCharacteristicForService(
      temperatureServiceUUID,
      temperatureCharacteristicUUID,
    );

    // Set the rate (in milliseconds) at which the temperature service
    // should send us updates on its temperature

    // the temperature is provided as a base64 value, so we convert it
    // to an number (base 10) to get its value in celcius.
    temperatureChar.monitor((error, {value}) => {
      if (error) {
        return;
      }
      const temperature = Base64.toUint8Array(value)[0];
      setTemperatureArray((t) => [{temperature, timeStamp: Date.now()}, ...t]);
    });
  };

  // useEffect to monitor changes to the device state and run the
  // connect and postconnect scripts if the device is found
  useEffect(() => {
    if (device?.id) {
      device
        .connect()
        .then(() => postConnect())
        .catch((e) => console.log(e));
    }
  }, [device]);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.iconContainer}>
        {device.id ? (
          <Icon
            size={50}
            name="bluetooth-b"
            title="Connected"
            color="#00FF00"
            onPress={() => setDevice(new Device())}
          />
        ) : (
          <Icon
            size={50}
            title="Disconnected"
            name="bluetooth-b"
            color={loading ? '#D3D3D3' : '#FF0000'}
            onPress={() => !loading && scanAndConnect()}
          />
        )}
      </View>
      <ScrollView style={styles.background} contentContainerStyle={styles.row}>
        {temperatureArray.map((temp, i) => {
          const values = Object.values(temp);
          return <CollectionCell cell={values} key={i} />;
        })}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  ...style,
  scrollView: {
    backgroundColor: Colors.lighter,
    paddingHorizontal: '5%',
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '20%',
    backgroundColor: '#161616',
    paddingTop: '10%',
    paddingBottom: '10%',
  },
  bigIcon: {
    height: '80%',
    width: '80%',
  },
});

export default App;
