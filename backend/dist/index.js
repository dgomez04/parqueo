"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const users_routes_1 = __importDefault(require("./routes/users.routes"));
const vehicles_routes_1 = __importDefault(require("./routes/vehicles.routes"));
const parking_routes_1 = __importDefault(require("./routes/parking.routes"));
const parkingSpaces_routes_1 = __importDefault(require("./routes/parkingSpaces.routes"));
const parkingRecords_routes_1 = __importDefault(require("./routes/parkingRecords.routes"));
const reports_routes_1 = __importDefault(require("./routes/reports.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/vehicles', vehicles_routes_1.default);
app.use('/api/parkings', parking_routes_1.default);
app.use('/api/parking-spaces', parkingSpaces_routes_1.default);
app.use('/api/parking-records', parkingRecords_routes_1.default);
app.use('/api/reports', reports_routes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
