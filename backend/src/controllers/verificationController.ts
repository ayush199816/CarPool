import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import express from 'express';
import Vehicle, { IVehicle } from '../models/Vehicle';
import { AuthenticatedUser } from '../types/express';

// Define the structure of the populated user
interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

// Define the structure of the vehicle with populated user
type VehicleWithUser = Omit<IVehicle, 'userId'> & {
  userId: PopulatedUser | string; // Handle both populated and non-populated cases
  verificationDocuments?: string[]; // Add missing property
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  createdAt?: Date;
};

// Extend the Express Request type to include the file and files property
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[];
    }
  }
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
  // No need for DestinationCallback explicitly here
  destination: (req, file, cb) => { // TypeScript will infer types from Multer's definitions
    try {
      console.log('=== Storage Destination Callback Executing ===');
      let userName = req.body.userName;
      let uploadType = req.body.uploadType;

      const actualUserName = Array.isArray(userName) ? userName[0] : (userName ? String(userName) : 'unknown');
      const actualUploadType = Array.isArray(uploadType) ? uploadType[0] : (uploadType ? String(uploadType) : 'user');

      console.log('req.body at destination start:', req.body);
      console.log('File object in destination:', file);
      console.log('Extracted values (destination):', { actualUploadType, actualUserName });

      const sanitizedUsername = actualUserName
        .replace(/@/g, '-')
        .replace(/[^a-z0-9-.]/gi, '_')
        .toLowerCase();

      const dir = path.join(
        __dirname,
        '..',
        '..',
        'uploads',
        actualUploadType === 'vehicle' ? 'Vehicle Verification' : 'User Verification',
        sanitizedUsername
      );

      fs.mkdirSync(dir, { recursive: true });

      console.log('Saving file to directory:', dir);
      cb(null, dir);
    } catch (error) {
      console.error('Error in destination callback:', error);
      cb(error instanceof Error ? error : new Error(String(error)), 'uploads/error');
    }
  },
  // No need for FileNameCallback explicitly here
  filename: (req, file, cb) => {
    try {
      console.log('=== Storage Filename Callback Executing ===');
      console.log('Full request headers:', JSON.stringify(req.headers, null, 2));
      console.log('Raw request body:', req.body);
      
      // Try different ways to get the username
      let userName = req.body?.userName || 
                    req.body?.fields?.userName || 
                    (req as any)?.user?.name || 
                    'unknown';
                    
      let uploadType = req.body?.uploadType || 'document';

      // Log the raw values before any processing
      console.log('Raw userName:', userName, 'Type:', typeof userName);
      console.log('Raw uploadType:', uploadType, 'Type:', typeof uploadType);

      // Handle array case (form-data can sometimes be arrays)
      const actualUserName = Array.isArray(userName) ? 
        (userName[0] || 'unknown') : 
        (userName ? String(userName) : 'unknown');
        
      const actualUploadType = Array.isArray(uploadType) ? 
        (uploadType[0] || 'document') : 
        (uploadType ? String(uploadType) : 'document');

      console.log('Processed values:', { 
        actualUserName, 
        actualUploadType,
        originalname: file.originalname,
        fieldname: file.fieldname
      });

      const sanitizedUsername = actualUserName
        .replace(/@/g, '-')
        .replace(/[^a-z0-9-.]/gi, '_')
        .toLowerCase();

      const ext = path.extname(file.originalname) || '';
      const timestamp = Date.now();
      const finalFilename = `${sanitizedUsername}-${actualUploadType}-${timestamp}${ext}`;

      console.log('Generated filename:', finalFilename);
      cb(null, finalFilename);
    } catch (error) {
      console.error('Error in filename callback:', error);
      cb(error instanceof Error ? error : new Error(String(error)), 'error');
    }
  },
});

// The rest of your code remains the same
// ... (fileFilter, uploadMiddleware, logFormData, processUpload, uploadFile, getFile)

// File filter to accept only images and PDFs
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image (JPEG, PNG, GIF) and PDF files are allowed'));
  }
};

// Configure multer with storage and file filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    fieldSize: 10 * 1024 * 1024, // 10MB for fields (to handle large usernames)
    fields: 10, // Maximum number of non-file fields
    files: 1,    // Maximum number of file fields (for the 'file' field)
  },
  fileFilter: fileFilter,
});

// Create a single-file upload middleware
const uploadSingle = upload.single('file');

// Custom middleware to log form data
const logFormData = (req: Request, res: Response, next: any) => {
  console.log('\n=== Incoming Request ===');
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Content-Type:', req.headers['content-type']);

  if (req.method === 'POST') {
    console.log('Request body (before multer, raw check):', req.body);
  }
  console.log('========================\n');
  next();
};

// Create a middleware that processes the file upload
const processUpload = (req: Request, res: Response, next: any) => {
  console.log('\n=== Starting file upload process ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Authorization header present:', !!req.headers.authorization);
  
  // Parse URL-encoded and JSON bodies first
  express.json()(req as express.Request, res as express.Response, () => {
    console.log('JSON middleware executed');
    
    express.urlencoded({ extended: true })(req as express.Request, res as express.Response, () => {
      console.log('URL-encoded middleware executed');
      console.log('Request body after parsing:', req.body);
            // Now handle the file upload
        console.log('Starting file upload with multer...');
        uploadSingle(req as express.Request, res as express.Response, (err: any) => {
        if (err) {
          console.error('Upload error:', err);
          console.error('Error stack:', err.stack);
          return res.status(400).json({
            success: false,
            message: err.message || 'Error processing upload',
            error: process.env.NODE_ENV === 'development' ? err.stack : undefined
          });
        }

        console.log('=== After multer processing (in processUpload middleware) ===');
        console.log('Request body (after multer):', req.body);
        console.log('Uploaded file (from req.file):', req.file);
        
        // Ensure we have the file and required fields
        if (!req.file) {
          console.error('No file found in request');
          console.log('Request body:', req.body);
          console.log('Request files:', req.files);
          return res.status(400).json({
            success: false,
            message: 'No file was uploaded',
            receivedFields: Object.keys(req.body),
            filesInRequest: req.files ? Object.keys(req.files) : 'No files'
          });
        }

        // Add the file to req.files for backward compatibility
        if (!req.files) {
          req.files = [req.file];
        }

        next();
      });
    });
  });
};

// Handle file upload
export const uploadFile = (req: Request, res: Response) => {
  logFormData(req, res, () => {
    processUpload(req, res, async () => {
      const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null);

      if (!uploadedFile) {
        console.error('No file was found after Multer processing.');
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded or processed correctly.',
        });
      }

      try {
        const uploadsBaseDir = path.join(__dirname, '..', '..', 'uploads');
        const relativePath = path.relative(uploadsBaseDir, uploadedFile.path).replace(/\\/g, '/');
        const fileUrl = `/uploads/${relativePath}`;


        console.log('File saved at:', uploadedFile.path);
        console.log('Generated file URL:', fileUrl);

        if (!fs.existsSync(uploadedFile.path)) {
          console.error('File was not saved at the expected location:', uploadedFile.path);
          return res.status(500).json({
            success: false,
            message: 'File saving failed unexpectedly. File not found on disk.',
          });
        } else {
          console.log('File exists at location on disk.');
        }

        res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          fileUrl: fileUrl,
        });
      } catch (error) {
        console.error('Error processing upload and generating URL:', error);
        res.status(500).json({
          success: false,
          message: 'Error processing file upload',
        });
      }
    });
  });
};

/**
 * @desc    Get pending verifications
 * @route   GET /api/verifications/pending
 * @access  Private/Admin
 */
export const getPendingVerifications = async (req: Request, res: Response) => {
  try {
    console.log('🔍 [getPendingVerifications] Querying for pending vehicles...');
    
    // Get pending vehicle verifications and populate user details
    const pendingVehicles = await Vehicle.find({ verificationStatus: 'pending' })
      .populate<{ userId: PopulatedUser }>('userId', 'name email phone')
      .select('-__v')
      .lean<VehicleWithUser[]>();
      
    console.log(`🔍 [getPendingVerifications] Found ${pendingVehicles.length} pending vehicles`);

    // Format the response to match frontend's expected structure
    const formattedVerifications = pendingVehicles.map(vehicle => {
      console.log(`🔍 [getPendingVerifications] Processing vehicle ${vehicle._id}`);
      
      // Get the first document URL if available, or use an empty string
      const documentUrl = vehicle.verificationDocuments?.[0] || '';
      
      return {
        _id: vehicle._id,
        user: {
          _id: typeof vehicle.userId === 'string' ? vehicle.userId : vehicle.userId?._id || '',
          name: (typeof vehicle.userId === 'object' && vehicle.userId?.name) || 'Unknown',
          email: (typeof vehicle.userId === 'object' && vehicle.userId?.email) || '',
        },
        vehicle: {
          make: vehicle.make,
          model: vehicle.modelName,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
        },
        documentUrl: documentUrl,
        status: vehicle.verificationStatus,
        createdAt: vehicle.createdAt?.toISOString() || new Date().toISOString(),
      };
    });

    res.status(200).json(formattedVerifications);
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending verifications'
    });
  }
};

/**
 * @desc    Update verification status
 * @route   PATCH /api/verifications/:id/status
 * @access  Private/Admin
 */
export const updateVerificationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body as { status: 'verified' | 'rejected'; rejectionReason?: string };

    console.log(`🔍 [updateVerificationStatus] Updating verification ${id} to status: ${status}`);

    // Validate status
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be either "verified" or "rejected"',
      });
    }

    // Find and update the vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      { 
        verificationStatus: status,
        ...(rejectionReason && { rejectionReason }),
        verifiedAt: status === 'verified' ? new Date() : null,
      },
      { new: true, runValidators: true }
    )
    .populate<{ userId: PopulatedUser }>('userId', 'name email phone')
    .lean<VehicleWithUser>();

    if (!updatedVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found',
      });
    }

    // Format the response to match frontend's expected structure
    const formattedVerification = {
      _id: updatedVehicle._id,
      user: {
        _id: typeof updatedVehicle.userId === 'string' ? updatedVehicle.userId : updatedVehicle.userId?._id || '',
        name: (typeof updatedVehicle.userId === 'object' && updatedVehicle.userId?.name) || 'Unknown',
        email: (typeof updatedVehicle.userId === 'object' && updatedVehicle.userId?.email) || '',
      },
      vehicle: {
        make: updatedVehicle.make,
        model: updatedVehicle.modelName,
        year: updatedVehicle.year,
        licensePlate: updatedVehicle.licensePlate,
      },
      documentUrl: updatedVehicle.verificationDocuments?.[0] || '',
      status: updatedVehicle.verificationStatus,
      createdAt: updatedVehicle.createdAt?.toISOString() || new Date().toISOString(),
    };

    res.status(200).json(formattedVerification);
  } catch (error: unknown) {
    console.error('Error updating verification status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({
      success: false,
      message: 'Error updating verification status',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
};

export const getFile = (req: Request, res: Response) => {
  try {
    const relativeFilePath = req.params[0];
    const uploadsBaseDir = path.join(__dirname, '..', '..', 'uploads');
    const filePath = path.join(uploadsBaseDir, relativeFilePath);

    if (!filePath.startsWith(uploadsBaseDir)) {
      console.error('Attempted directory traversal:', filePath);
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        const nodeError = err as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          return res.status(404).json({ success: false, message: 'File not found' });
        }
        res.status(500).json({ success: false, message: 'Error serving file' });
      }
    });
  } catch (error) {
    console.error('Unexpected error in getFile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};