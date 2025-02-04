import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Feather from 'react-native-vector-icons/Feather';
import {EditProfileDetailsProps} from '../../navigation/StackParamList';
import {launchImageLibrary} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import DatePicker from 'react-native-date-picker';
import firestore from '@react-native-firebase/firestore';
import RNFS from 'react-native-fs';
import {useEffect} from 'react';

const EditProfileDetails: React.FC<EditProfileDetailsProps> = ({
  navigation,
}) => {
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [dob, setDob] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const [title, setTitle] = useState('');
  const [gender, setGender] = useState('');
  const [mobile, setMobile] = useState('44207334 3456');
  const [religion, setReligion] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [occupation, setOccupation] = useState('');
  const [homePhone, setHomePhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleMobileChange = text => {
    const numericText = text.replace(/[^0-9]/g, '');
    setMobile(numericText);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = auth().currentUser?.uid;
      if (!userId) return;

      try {
        const userDoc = await firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setTitle(userData.title || '');
          setDob(userData.dob || '');
          setGender(userData.gender || '');
          setMobile(userData.mobile || '');
          setReligion(userData.religion || '');
          setMaritalStatus(userData.maritalStatus || '');
          setZipCode(userData.zipCode || '');
          setOccupation(userData.occupation || '');
          setHomePhone(userData.homePhone || '');
          setAddress(userData.address || '');
          setNotes(userData.notes || '');
          setImageUrl(userData.profileImage || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const selectImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        console.error('ImagePicker Error: ', response.errorMessage);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri);
      }
    });
  };

  const uploadImage = async () => {
    try {
      if (!imageUri) {
        Alert.alert('Error', 'Please select an image first.');
        return;
      }

      setUploading(true);

      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }

      const userId = user.uid;
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}.jpg`;
      const storagePath = `profileImages/${fileName}`;
      const reference = storage().ref(storagePath);

      // Move Image to a Public Directory (Prevent Cache Issues)
      const newPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      await RNFS.copyFile(imageUri, newPath);

      // Check if the file exists at the new location
      const fileExists = await RNFS.exists(newPath);
      if (!fileExists) {
        throw new Error('File does not exist at the specified path.');
      }

      console.log('New Image Path:', newPath);

      // Upload the image from the new location
      await reference.putFile(newPath);
      console.log('Upload successful!');

      // Get download URL
      const downloadURL = await reference.getDownloadURL();
      console.log('Download URL:', downloadURL);

      // Save URL to Firestore

      await firestore().collection('users').doc(userId).update({
        profileImage: downloadURL,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      setImageUrl(downloadURL);
      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName || !lastName || !title || !dob || !mobile || !address) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const userId = auth().currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    setUploading(true);

    try {
      await uploadImage(); // Ensure image uploads first before updating profile data

      const profileData = {
        title,
        dob,
        gender,
        mobile,
        religion,
        maritalStatus,
        occupation,
        homePhone,
        address,
        notes,
        profileImage: imageUrl,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('users').doc(userId).update(profileData);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.navigate('Main');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather
            name="arrow-left"
            size={24}
            color="#002F67"
            style={styles.backButton}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Edit Profile Information</Text>
      </View>

      <View style={styles.profileContainer}>
        <TouchableOpacity>
          <Image
            source={
              imageUri
                ? {uri: imageUri}
                : require('../../assets/profileImage.png')
            }
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editIcon}>
            <Feather
              name="upload"
              size={16}
              color="#fff"
              onPress={selectImage}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <CustomInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          required
        />
        <CustomInput
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          required
        />
        <CustomInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Mr./Mrs."
          dropdownOptions={['Mr.', 'Mrs.']}
          required
        />
        <CustomInput
          label="Date of Birth"
          value={dob}
          placeholder="Pick Date"
          onChangeText={setDob}
          isDate
          onDatePress={() => setOpen(true)}
        />

        <DatePicker
          modal
          open={open}
          date={date}
          mode="date"
          onConfirm={date => {
            setOpen(false);
            setDate(date);
            setDob(date.toDateString());
          }}
          onCancel={() => setOpen(false)}
        />
        <CustomInput
          label="Gender"
          value={gender}
          onChangeText={setGender}
          placeholder="Select Gender"
          dropdownOptions={['Male', 'Female']}
        />
        <CustomInput
          label="Mobile No."
          value={mobile}
          onChangeText={handleMobileChange}
          required
          keyboardType="numeric"
        />
        <CustomInput
          label="Religion"
          value={religion}
          onChangeText={setReligion}
          placeholder="Select Religion"
          dropdownOptions={['Islam', 'Christianity', 'Others']}
        />
        <CustomInput
          label="Marital Status"
          value={maritalStatus}
          onChangeText={setMaritalStatus}
          placeholder="Select Status"
          dropdownOptions={['Single', 'Married']}
        />
        <CustomInput
          label="Zip Code"
          value={zipCode}
          onChangeText={setZipCode}
          keyboardType="numeric"
        />
        <CustomInput
          label="Occupation"
          value={occupation}
          onChangeText={setOccupation}
        />
        <CustomInput
          label="Home Phone"
          value={homePhone}
          onChangeText={setHomePhone}
          keyboardType="phone-pad"
        />
        <CustomInput
          label="Address"
          value={address}
          placeholder={'Enter Address'}
          onChangeText={setAddress}
          required
        />
        <CustomInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleSaveProfile}>
        <Text style={styles.nextButtonText}>Save & Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  required,
  isDate,
  dropdownOptions,
  keyboardType,
  onDatePress,
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>
      {required && <Text style={styles.required}>* </Text>}
      {label}
    </Text>
    <View style={styles.inputWrapper}>
      {dropdownOptions ? (
        <Picker
          selectedValue={value}
          onValueChange={onChangeText}
          style={styles.picker}>
          <Picker.Item label="Select..." value="" />
          {dropdownOptions.map((option, index) => (
            <Picker.Item key={index} label={option} value={option} />
          ))}
        </Picker>
      ) : (
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
        />
      )}
      {isDate && (
        <Feather
          name="calendar"
          size={20}
          color="#555"
          style={styles.icon}
          onPress={onDatePress}
        />
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 50,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002F67',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    backgroundColor: '#002F67',
    padding: 5,
    borderRadius: 15,
  },
  formContainer: {
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#737373',
    marginBottom: 5,
  },
  required: {
    color: 'red',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E8E6EA',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#555',
  },
  picker: {
    flex: 1,
    fontSize: 16,
  },
  icon: {
    marginLeft: 10,
    color: '#555',
  },
  nextButton: {
    backgroundColor: '#002F63',
    borderRadius: 99,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 50,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileDetails;
