export default function DataTable({ columns, rows, empty }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell || "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="state small">{empty}</div>}
    </div>
  );
}
