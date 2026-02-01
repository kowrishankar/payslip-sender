import fs from "fs";
import path from "path";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const EMPLOYEES_FILE = path.join(DATA_DIR, "employees.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readEmployees(): Employee[] {
  ensureDataDir();
  if (!fs.existsSync(EMPLOYEES_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(EMPLOYEES_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeEmployees(employees: Employee[]) {
  ensureDataDir();
  fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2));
}

export function getAllEmployees(): Employee[] {
  return readEmployees();
}

export function addEmployee(employee: Omit<Employee, "id" | "createdAt">): Employee {
  const employees = readEmployees();
  const newEmployee: Employee = {
    ...employee,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  employees.push(newEmployee);
  writeEmployees(employees);
  return newEmployee;
}

export function deleteEmployee(id: string): boolean {
  const employees = readEmployees().filter((e) => e.id !== id);
  if (employees.length === readEmployees().length) return false;
  writeEmployees(employees);
  return true;
}

export function getEmployeeById(id: string): Employee | undefined {
  return readEmployees().find((e) => e.id === id);
}
