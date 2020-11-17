//@flow

import React, {useEffect, useState, useMemo, useRef} from 'react';
import {StyleSheet, ScrollView, View, StatusBar, Button} from 'react-native';

import {Base64} from 'js-base64';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {BleManager, Device} from 'react-native-ble-plx';

import CollectionCell from './CollectionCell';

import Icon from 'react-native-vector-icons/FontAwesome';

import style from './style.js';

import NotifService from './NotifService';

const temperatureServiceUUID: string = 'e95d6100-251d-470a-a062-fa1922dfa9a8';
const temperatureCharacteristicUUID: string =
  'e95d9250-251d-470a-a062-fa1922dfa9a8';
//const temperaturePeriodUUID: string = 'e95d1b25-251d-470a-a062-fa1922dfa9a8';

import DateTimePicker from '@react-native-community/datetimepicker';

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
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now()));
  const [endDate, setEndDate] = useState(new Date());
  const [mode, setMode] = useState('date');
  const notifications = new NotifService();
  const mounted = useRef(false);
  //const [allValues, setAllValues] = useState({
  //  loading: false,
  //  showStartDate: false,
  //  showEndDate: false,

  //})

  const scanAndConnect = async () => {
    // Attempt to retrieve a stored UUID from a previous session,
    // and if successful, connect to that device and update the
    // state with it. Not currently working so commented out.

    //const storedId = await AsyncStorage.getItem('microBitID');
    //if (storedId) {
    //  console.log('found previous device');
    //  setDevice(await manager.connectToDevice(storedId));
    //  setLoading(false);
    //  return;
    //}

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
    temperatureChar.monitor((error, update) => {
      if (error || !update) {
        return;
      }
      const temperature = Base64.toUint8Array(update.value)[0];
      setTemperatureArray((t) => [{temperature, timeStamp: Date.now()}, ...t]);
    });

    manager.onDeviceDisconnected(device.id, (err, lost) => {
      if (err) {
        console.log('error:', err);
        return;
      }
      setDevice(new Device());
      notifications.cancelAll();
      notifications.localNotif();
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

  const onStartDateChange = (event, value) => {
    value && setStartDate(value.getTime());
    if (mode === 'date') {
      value && setStartDate(value.getTime());
    } else {
      value &&
        setStartDate((d) => {
          const returnDate = new Date(d);
          returnDate.setHours(value.getHours());
          returnDate.setMinutes(value.getMinutes());
          returnDate.setSeconds(0);
          return returnDate.getTime();
        });
    }
    setShowEndDate(false);
  };

  useEffect(() => {
    if (mounted.current) {
      if (showEndDate === false) {
        if (mode === 'date') {
          setMode('time');
          setShowEndDate(true);
        } else {
          setMode('date');
        }
      }
    } else {
      mounted.current = true;
    }
  }, [showEndDate]);

  const filteredList = useMemo(() => {
    return temperatureArray.filter((t) => {
      return t.timeStamp >= startDate && t.timeStamp <= endDate;
    });
  }, [temperatureArray, startDate, endDate]);

  const onEndDateChange = (event, value) => {
    if (mode === 'date') {
      value && setEndDate(value.getTime());
    } else {
      value &&
        setEndDate((d) => {
          const returnDate = new Date(d);
          returnDate.setHours(value.getHours());
          returnDate.setMinutes(value.getMinutes());
          returnDate.setSeconds(0);
          return returnDate.getTime();
        });
    }
    setShowEndDate(false);
  };

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
            style={{paddingRight: '5%'}}
          />
        ) : (
          <Icon
            size={50}
            title="Disconnected"
            name="bluetooth-b"
            color={loading ? '#D3D3D3' : '#FF0000'}
            onPress={() => !loading && scanAndConnect()}
            style={{paddingRight: '5%'}}
          />
        )}
        <View style={{width: '40%', paddingHorizontal: '2.5%'}}>
          <Button
            onPress={() => setShowStartDate(true)}
            title="Set Start Date"
          />
        </View>
        <View style={{width: '40%', paddingHorizontal: '2.5%'}}>
          <Button
            title="Set Ending Date"
            onPress={() => setShowEndDate(true)}
          />
        </View>
      </View>
      {showStartDate && (
        <DateTimePicker
          mode={mode}
          value={new Date(startDate)}
          onChange={onStartDateChange}
        />
      )}
      {showEndDate && (
        <DateTimePicker
          mode={mode}
          value={new Date(endDate)}
          onChange={onEndDateChange}
        />
      )}
      {!showStartDate && !showEndDate && (
        <ScrollView
          style={styles.background}
          contentContainerStyle={styles.row}>
          {filteredList.map((temp, i) => {
            const values = Object.values(temp);
            return <CollectionCell cell={values} key={i} />;
          })}
        </ScrollView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  ...style,
  body: {
    backgroundColor: Colors.white,
  },
  iconContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '10%',
    backgroundColor: '#161616',
    paddingTop: '5%',
    paddingLeft: '5%',
    elevation: 3,
  },
});

export default App;
