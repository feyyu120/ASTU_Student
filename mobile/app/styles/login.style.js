import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 6,
    alignSelf: "center",
  },
  form: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 32,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  input: {
    marginVertical: 5,
    backgroundColor: "transparent",
  },
});

export default styles;