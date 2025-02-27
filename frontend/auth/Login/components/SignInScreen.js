import React, { Component } from 'react';
import {
  View,
  AsyncStorage,
  Linking,
  Text,
  Image,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { AuthSession } from 'expo';
import vinylAxios from 'axios';
import * as Animatable from 'react-native-animatable';
const windowSize = Dimensions.get('window');
import { Button } from '#common/';

const backgroundImg = require('#assets/images/vinyl-record-player.png');
const power = require('#assets/images/power.png');

class SignInScreen extends Component {
  static navigationOptions = {
    header: null,
  };

  state = {
    verifier: '',
    authData: {},
    accessData: {},
  };

  componentDidMount() {
    const url = AuthSession.getRedirectUrl();
    Linking.addEventListener(`${url}`, this._handleOpenURL());
  }

  async componentDidUpdate(prevProps, prevState) {
    const token = AsyncStorage.getItem('access_token');
    if (!prevState.verifier.length && this.state.verifier.length) {
      await this.getAccessToken();
    }
  }

  componentWillUnmount() {
    const url = AuthSession.getRedirectUrl();

    Linking.removeEventListener(`${url}`, this._handleOpenURL());
  }

  _handlePressAsync = () => {
    const proxyUrl = 'http://localhost:3000/authorize';

    vinylAxios.get(proxyUrl).then(res => {
      this.setState({ authData: res.data });
      this.asyncGetData(res.data.authorizeUrl);
    });
  };

  asyncGetData = async url => {
    const oauthReturnObj = await AuthSession.startAsync({
      authUrl: url,
    });

    this.setState({
      verifier: oauthReturnObj.params.oauth_verifier,
    });
  };

  _handleOpenURL = () => {
    if (this.state.accessData.token) {
      this.props.navigation.push('App');
    }
  };

  getAccessToken = () => {
    const { verifier, authData } = this.state;
    const proxyUrl = 'http://localhost:3000/callback';
    const url = `${proxyUrl}?oauth_verifier=${verifier}`;
    vinylAxios
      .post(url, authData)
      .then(response => {
        this.setState({ accessData: response.data });
        this.props.screenProps.getDiscogsIdentity(response.data);

        const { token, tokenSecret } = response.data;

        AsyncStorage.multiSet([
          ['access_token', token],
          ['access_secret', tokenSecret],
        ]);
      })
      .catch(error => {
        if (error.response) {
          console.log(error.response || error.message);
        }
      });
  };

  render() {
    return (
      <View style={styles.imagesContainer}>
        <ImageBackground style={styles.backgroundImage} source={backgroundImg}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Powered by Discogs</Text>
            <Image style={styles.logo} source={power} />
            <Text style={styles.subText}>
              Vinylizr is a companion tool that uses the cataloging features of
              Discogs.
            </Text>
          </View>

          <Animatable.View animation="fadeIn" style={styles.animateStyles}>
            <Button onPress={this._handlePressAsync}>Get Started</Button>
          </Animatable.View>
        </ImageBackground>
      </View>
    );
  }
}

const styles = {
  animateStyles: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  headingContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 100,
    width: 295,
  },
  title: {
    backgroundColor: 'transparent',
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 29,
    marginBottom: 10,
  },
  subText: {
    backgroundColor: 'transparent',
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 29,
    marginTop: 10,
    textAlign: 'center',
  },
  logo: {
    width: 24,
    height: 28,
  },
  imagesContainer: {
    width: windowSize.width,
    height: windowSize.height,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,
    width: windowSize.width,
    height: windowSize.height,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
};

export default SignInScreen;
