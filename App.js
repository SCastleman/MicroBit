//@flow

import React, {useEffect, useState, useMemo} from 'react';
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
  const notifications = new NotifService();
  const [endDate, setEndDate] = useState({
    date: new Date().getTime() + 86400000,
    mode: 'date',
    show: false,
  });
  const [startDate, setStartDate] = useState({
    date: new Date().getTime(),
    mode: 'date',
    show: false,
  });

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

  useEffect(() => {
    AsyncStorage.getItem('temperature', (err, result) => {
      if (err) {
        return;
      }
      console.log(result);
      const parsed = result ? JSON.parse(result) : [];
      console.log('parsed', parsed);
      setTemperatureArray(parsed);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      'temperature',
      temperatureArray ? JSON.stringify(temperatureArray) : [],
    );
  }, [temperatureArray]);

  const onStartDateChange = (event, value) => {
    console.log(event);
    if (startDate.mode === 'date') {
      if (value) {
        const returnDate = value.getTime();
        setStartDate({...startDate, mode: 'time', date: returnDate});
      }
    } else {
      if (value) {
        const returnDate = new Date(startDate.date);
        returnDate.setHours(value.getHours());
        returnDate.setMinutes(value.getMinutes());
        returnDate.setSeconds(0);
        setStartDate({mode: 'date', date: returnDate, show: false});
      }
    }
  };

  //useEffect(() => {
  //  if (mounted.current) {
  //    if (endDate.show === false) {
  //      if (mode === 'date') {
  //        setMode('time');
  //        setShowEndDate(true);
  //      } else {
  //        setMode('date');
  //      }
  //    }
  //  } else {
  //    mounted.current = true;
  //  }
  //}, [showEndDate]);

  const filteredList = useMemo(() => {
    return temperatureArray.filter((t) => {
      return t.timeStamp >= startDate.date && t.timeStamp < endDate.date;
    });
  }, [temperatureArray, startDate, endDate]);

  const onEndDateChange = (event, value) => {
    if (endDate.mode === 'date') {
      if (value) {
        const returnValue = value.getTime();
        setEndDate({show: true, date: returnValue, mode: 'time'});
      } else {
        setEndDate({...endDate, show: false});
      }
    } else {
      if (value) {
        const returnDate = new Date(endDate.date);
        returnDate.setHours(value.getHours());
        returnDate.setMinutes(value.getMinutes());
        returnDate.setSeconds(0);
        setEndDate({show: false, mode: 'time', date: returnDate.getTime()});
      } else {
        setEndDate({...endDate, show: false});
      }
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
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
            onPress={() =>
              setStartDate({...startDate, show: true, mode: 'date'})
            }
            title="Set Start Date"
          />
        </View>
        <View style={{width: '40%', paddingHorizontal: '2.5%'}}>
          <Button
            title="Set Ending Date"
            onPress={() => setEndDate({...endDate, show: true, mode: 'date'})}
          />
        </View>
      </View>
      {startDate.show && (
        <DateTimePicker
          mode={startDate.mode}
          value={new Date(startDate.date)}
          onChange={onStartDateChange}
          is24Hour={true}
        />
      )}
      {endDate.show && (
        <DateTimePicker
          mode={endDate.mode}
          value={new Date(endDate.date)}
          onChange={onEndDateChange}
          is24Hour={true}
        />
      )}
      <ScrollView style={styles.background} contentContainerStyle={styles.row}>
        {!startDate.show &&
          !endDate.show &&
          filteredList.map((temp, i) => {
            const values = Object.values(temp);
            return <CollectionCell cell={values} key={i} />;
          })}
      </ScrollView>
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
