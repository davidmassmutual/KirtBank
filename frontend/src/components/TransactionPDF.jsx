import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20 },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1 },
  row: { flexDirection: 'row' },
  cell: { width: '25%', borderStyle: 'solid', borderWidth: 1, padding: 5, fontSize: 10 },
});

function TransactionPDF({ transactions }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Transaction History</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={styles.cell}>Date</Text>
            <Text style={styles.cell}>Type</Text>
            <Text style={styles.cell}>Amount</Text>
            <Text style={styles.cell}>Status</Text>
          </View>
          {transactions.map(t => (
            <View key={t._id} style={styles.row}>
              <Text style={styles.cell}>{new Date(t.date).toLocaleDateString()}</Text>
              <Text style={styles.cell}>{t.type}</Text>
              <Text style={styles.cell}>${t.amount}</Text>
              <Text style={styles.cell}>{t.status}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export default TransactionPDF;