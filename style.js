/** Object for keeping track of styles used in multiple pages. */
export const appBackground = '#161616';
export const boxBackground = '#393939';
export const blueBackground = '#0f62fe';
export const lightBlue = '#33b1ff';

const shadow = {
  shadowColor: 'rgba(0,0,0, .4)', // IOS
  shadowOffset: {height: 4, width: 4}, // IOS
  shadowOpacity: 10, // IOS
  shadowRadius: 1, // IOS
  elevation: 2, // Android
};
const style = {
  container: {
    flex: 1,
    backgroundColor: appBackground,
  },
  contentContainer: {
    paddingTop: 30,
  },
  row: {
    paddingVertical: 30,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-around', // causing odd numbers to be centered, undesirable
    backgroundColor: appBackground,
  },
  bigBox: {
    ...shadow,
    width: '80%',
    paddingBottom: '40%',
    backgroundColor: boxBackground,
    borderRadius: 20,
  },
  stat: {
    position: 'absolute',
    marginHorizontal: 0,
    left: 0,
    right: 0,
    marginTop: '40%',
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  header: {
    textAlign: 'center',
    color: '#fff',
    backgroundColor: blueBackground,
    alignSelf: 'center',
    lineHeight: 28,
    fontSize: 16,
    fontWeight: 'bold',
    width: '80%',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: '75%',
    marginBottom: '-70%',
    position: 'absolute',
    flexShrink: 1,
    paddingHorizontal: '5%',
  },
  site: {
    width: '90%',
    marginLeft: '10%',
    marginRight: '10%',
    backgroundColor: boxBackground,
    borderRadius: 10,
    height: 60,
    justifyContent: 'center',
    ...shadow,
  },
  background: {
    backgroundColor: appBackground,
  },

  circle: {
    width: '40%',
    height: 0,
    paddingBottom: '40%',
    backgroundColor: blueBackground,
    borderRadius: 100,
    marginTop: '5%',
    overflow: 'scroll',
    ...shadow,
  },

  line: {
    borderBottomColor: '#fff',
    borderBottomWidth: 1,
    width: '90%',
    marginHorizontal: '5%',
    marginBottom: '10%',
    paddingBottom: '1%',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activity: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 300,
    bottom: 0,
    alignItems: 'center',
  },
};

export default style;
