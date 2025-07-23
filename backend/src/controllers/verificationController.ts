import { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer'; // multer types are usually inferred
import path from 'path';
import fs from 'fs';

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
const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    fieldSize: 10 * 1024 * 1024, // 10MB for fields (to handle large usernames)
    fields: 10, // Maximum number of non-file fields
    files: 1,    // Maximum number of file fields (for the 'file' field)
  },
  fileFilter: fileFilter,
});

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

// Create a middleware that processes the file upload using upload.fields()
const processUpload = (req: Request, res: Response, next: any) => {
  console.log('=== Starting file upload process (processUpload middleware) ===');

  uploadMiddleware.fields([
    { name: 'file', maxCount: 1 },
    { name: 'userName', maxCount: 1 },
    { name: 'uploadType', maxCount: 1 }
  ])(req, res, (err: any) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Error processing upload',
      });
    }

    console.log('=== After multer processing (in processUpload middleware) ===');
    console.log('Request body (after multer):', req.body);
    console.log('Uploaded file (from req.file):', req.file);
    console.log('Uploaded files (from req.files):', req.files);

    next();
  });
};

// Handle file upload
export const uploadFile = (req: Request, res: Response) => {
  logFormData(req, res, () => {
    processUpload(req, res, async () => {
      const uploadedFile = (req.files as { file?: Express.Multer.File[] })?.file?.[0];

      if (!uploadedFile) {
        console.error('No file was found in req.files.file[0] after Multer processing.');
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

// Serve uploaded files
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