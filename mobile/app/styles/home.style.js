import { StyleSheet } from "react-native";
import Colors from "../constant/color"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
   
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,

  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginVertical: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
});

export default styles;