import { Request, Response, NextFunction } from 'express';
import Vehicle, { IVehicle } from '../models/Vehicle';
import { IUser } from '../models/User';

// Type for authenticated requests
type AuthRequest = Request & {
  user: IUser & { _id: any };
};

/**
 * @desc    Add a new vehicle
 * @route   POST /api/vehicles
 * @access  Private
 */
export const addVehicle = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      make,
      modelName,
      year,
      color,
      licensePlate,
      registrationNumber,
      registrationExpiry,
      insuranceProvider,
      insuranceNumber,
      insuranceExpiry,
      vehicleType = 'car',
      verificationDocuments = [],
    } = req.body;

    // Basic validation
    if (!req.user) {
      console.error('No user in request');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Validate required fields
    const requiredFields = ['make', 'modelName', 'year', 'color', 'licensePlate', 'registrationNumber', 'registrationExpiry'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Check if vehicle with same license plate or registration number already exists
    const existingVehicle = await Vehicle.findOne({
      $or: [
        { licensePlate: licensePlate.trim().toUpperCase() },
        { registrationNumber: registrationNumber.trim() },
      ],
    });

    if (existingVehicle) {
      console.error('Vehicle with same license plate or registration number already exists');
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this license plate or registration number already exists',
      });
    }

    // Create new vehicle
    const vehicleData = {
      userId: req.user._id,
      make: make.trim(),
      modelName: modelName.trim(),
      year: Number(year),
      color: color.trim(),
      licensePlate: licensePlate.trim().toUpperCase(),
      registrationNumber: registrationNumber.trim(),
      registrationExpiry: new Date(registrationExpiry),
      insuranceProvider: insuranceProvider?.trim(),
      insuranceNumber: insuranceNumber?.trim(),
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
      vehicleType: vehicleType || 'car',
      verificationDocuments: Array.isArray(verificationDocuments) ? verificationDocuments : [],
      verificationStatus: verificationDocuments.length > 0 ? 'pending' : 'pending',
    };

    console.log('Creating vehicle with data:', JSON.stringify(vehicleData, null, 2));
    
    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    console.log('Vehicle created successfully:', vehicle._id);
    
    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Error adding vehicle:', error);
    console.error('Error stack:', error.stack);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((e: any) => e.message);
      console.error('Validation errors:', validationErrors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Check for duplicate key error
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(400).json({
        success: false,
        message: 'Duplicate key error',
        duplicateFields: error.keyValue,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add vehicle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get all vehicles for a user
 * @route   GET /api/vehicles
 * @access  Private
 */
export const getVehicles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const vehicles = await Vehicle.find({ userId: req.user._id, isActive: true });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error: any) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get a single vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Private
 */
export const getVehicle = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update a vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private
 */
export const updateVehicle = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const updates = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.userId;
    delete updates.verificationStatus;
    delete updates.verificationDocuments;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Format specific fields
    if (updates.licensePlate) {
      updates.licensePlate = updates.licensePlate.trim().toUpperCase();
    }
    if (updates.registrationNumber) {
      updates.registrationNumber = updates.registrationNumber.trim();
    }
    if (updates.registrationExpiry) {
      updates.registrationExpiry = new Date(updates.registrationExpiry);
    }
    if (updates.insuranceExpiry) {
      updates.insuranceExpiry = new Date(updates.insuranceExpiry);
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to update it',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete a vehicle (soft delete)
 * @route   DELETE /api/vehicles/:id
 * @access  Private
 */
export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to delete it',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: {},
    });
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Add verification documents to a vehicle
 * @route   POST /api/vehicles/:id/documents
 * @access  Private
 */
export const addVehicleDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { documents } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one document URL',
      });
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        $addToSet: { verificationDocuments: { $each: documents } },
        $set: { verificationStatus: 'pending' },
      },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to update it',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Documents added successfully',
      data: vehicle,
    });
  } catch (error: any) {
    console.error('Error adding vehicle documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
