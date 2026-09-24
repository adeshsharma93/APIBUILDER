export interface TableInfo {
    name: string;
    schema: string;
    rowCount: number;
    columns: ColumnInfo[];
    indexes: IndexInfo[];
}
export interface ColumnInfo {
    name: string;
    dataType: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    foreignKeyTable?: string;
    foreignKeyColumn?: string;
    maxLength?: number;
    defaultValue?: string;
}
export interface IndexInfo {
    name: string;
    columns: string[];
    isUnique: boolean;
    isClustered: boolean;
}
export declare class SchemaService {
    /**
     * Fetch all tables from a database
     */
    getTables(connectionId: string, dbType?: 'mysql' | 'sqlserver'): Promise<TableInfo[]>;
    /**
     * Fetch tables from MySQL database
     */
    private getMysqlTables;
    /**
     * Fetch tables from SQL Server database
     */
    private getSqlServerTables;
}
export declare const schemaService: SchemaService;
//# sourceMappingURL=schemaService.d.ts.map