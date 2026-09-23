import { UserProfile } from "../types";

const STORAGE_KEY = "safepit_current_user";
const USERS_LIST_KEY = "safepit_registered_users";

export const DEMO_ADMIN: UserProfile = {
  id: "admin-1",
  mineName: "Jharia Coalfield (BCCL Mine #4)",
  mineLocation: {
    state: "Jharkhand",
    city: "Dhanbad",
    pinCode: "828111",
    coordinates: { lat: 23.754, lng: 86.413 }
  },
  firstName: "Rajesh",
  lastName: "Sharma",
  employeeId: "ADMIN-01",
  password: "admin",
  role: "admin",
  bloodGroup: "B+",
  height: "176 cm",
  weight: "74 kg",
  age: "38",
  hasMedicalCondition: false,
  medicalConditionDetails: "",
  emergencyContact: {
    name: "Sunita Sharma (Spouse)",
    phone: "+91 98765 43210",
    relation: "Spouse"
  },
  profilePictureUrl: "logo.png"
};

export const DEMO_USER: UserProfile = {
  id: "user-1",
  mineName: "Jharia Coalfield (BCCL Mine #4)",
  mineLocation: {
    state: "Jharkhand",
    city: "Dhanbad",
    pinCode: "828111",
    coordinates: { lat: 23.754, lng: 86.413 }
  },
  firstName: "Amit",
  lastName: "Kumar",
  employeeId: "MINER-402",
  password: "user",
  role: "user",
  bloodGroup: "O+",
  height: "172 cm",
  weight: "68 kg",
  age: "29",
  hasMedicalCondition: true,
  medicalConditionDetails: "Occasional dust allergy, uses prescribed inhaler in underground operations",
  emergencyContact: {
    name: "Ramesh Kumar (Brother)",
    phone: "+91 98123 45678",
    relation: "Brother"
  },
  profilePictureUrl: ""
};

class UserService {
  private users: UserProfile[] = [DEMO_ADMIN, DEMO_USER];

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    try {
      const stored = localStorage.getItem(USERS_LIST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.users = parsed;
        }
      } else {
        this.saveUsers();
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(this.users));
    } catch {
      // Ignore
    }
  }

  getCurrentUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    return null;
  }

  setCurrentUser(user: UserProfile | null) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }

  login(employeeId: string, password?: string): UserProfile | null {
    const trimmedId = employeeId.trim().toUpperCase();
    const found = this.users.find(u => u.employeeId.toUpperCase() === trimmedId);
    if (found) {
      if (!password || !found.password || found.password === password) {
        this.setCurrentUser(found);
        return found;
      }
    }
    return null;
  }

  register(profile: UserProfile): UserProfile {
    const newProfile = {
      ...profile,
      id: profile.id || `user-${Date.now()}`
    };
    const existingIndex = this.users.findIndex(
      u => u.employeeId.toUpperCase() === newProfile.employeeId.toUpperCase()
    );
    if (existingIndex >= 0) {
      this.users[existingIndex] = newProfile;
    } else {
      this.users.push(newProfile);
    }
    this.saveUsers();
    this.setCurrentUser(newProfile);
    return newProfile;
  }

  updateProfile(profile: UserProfile): UserProfile {
    return this.register(profile);
  }

  logout() {
    this.setCurrentUser(null);
  }
}

export const userService = new UserService();
