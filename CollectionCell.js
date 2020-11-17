import React from 'react';
import {Text, View, StyleSheet, ViewPropTypes} from 'react-native';
import PropTypes from 'prop-types';
import style from './style';
import chroma from 'chroma-js';

const styles = StyleSheet.create({
  ...style,
  temperature: {
    position: 'absolute',
    marginHorizontal: 0,
    left: 0,
    right: 0,
    marginTop: '15%',
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 30,
    fontWeight: 'bold',
  },
});

/** Reusable cell to populate with data. Used by almost all screens.
 * @param {Array} Cell array with the header at position 0 and the stat at position 1
 * @param {Object} custStyle Object with custom styles for the box. Defaults to 'bigBox'
 * @param {Object} custStat Object with custom styles for the stat. Defaults to 'stat'
 * @param {Object} custHeader Object with custom styles for the header. Defaults to 'header'
 * @param {Number} numLines Number of lines for the header text. Defaults to 1 */

const CollectionCell = (props) => {
  const {custStat, custStyle, cell} = props;
  const [headerText, statText] = cell;
  const f = chroma.scale(['green', 'yellow', 'red']);
  console.log(f(headerText / 34).toString());
  return (
    <View style={custStyle}>
      <Text style={custStat}>
        {`Time: ${new Date(statText).toLocaleTimeString()}`}
      </Text>
      <Text
        style={{
          ...styles.temperature,
          color: headerText < 32 ? f(headerText / 40).toString() : '#FF0000',
        }}>{`${headerText}° Celcius`}</Text>
    </View>
  );
};

CollectionCell.propTypes = {
  custStyle: ViewPropTypes.style,
  custStat: Text.propTypes.style,
  numLines: PropTypes.number,
  custHeader: Text.propTypes.style,
  cell: PropTypes.arrayOf(PropTypes.number).isRequired,
};

CollectionCell.defaultProps = {
  custStyle: styles.bigBox,
  numLines: 1,
  custHeader: styles.header,
  custStat: styles.stat,
};

export default CollectionCell;
