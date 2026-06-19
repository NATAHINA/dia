import mongoose, { Document, Schema, CallbackError } from 'mongoose';

interface IMarketing extends Document {
  date: Date;
  publication: string;
  portee: number;
  messages: number;
  reservationsObtenues: number;
  score: number;
}

const MarketingSchema = new Schema<IMarketing>(
  {
    date: { type: Date, required: true },
    publication: { type: String, required: true, trim: true },
    portee: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    reservationsObtenues: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MarketingSchema.pre<IMarketing>('save', async function () {
  if (this.isModified('messages') || this.isModified('reservationsObtenues')) {
    this.score = Number(this.messages) + (Number(this.reservationsObtenues) * 10);
  }
});

export default mongoose.models.Marketing || mongoose.model<IMarketing>('Marketing', MarketingSchema);


// import mongoose from 'mongoose';

// const MarketingSchema = new mongoose.Schema(
//   {
//     date: {
//       type: Date,
//       required: [true, 'La date est obligatoire'],
//     },
//     publication: {
//       type: String,
//       required: [true, 'Le nom de la publication est obligatoire'],
//       trim: true,
//     },
//     portee: {
//       type: Number,
//       default: 0,
//     },
//     messages: {
//       type: Number,
//       default: 0,
//     },
//     reservationsObtenues: {
//       type: Number,
//       default: 0,
//     },
//     score: {
//       type: Number,
//       default: 0,
//     },
//   },
//   {
//     timestamps: true, 
//   }
// );

// MarketingSchema.pre('save', function(next) {
//   if (this.isModified('messages') || this.isModified('reservationsObtenues')) {
//     this.score = Number(this.messages) + (Number(this.reservationsObtenues) * 10);
//   }
//   next();
// });

// export default mongoose.models.Marketing || mongoose.model('Marketing', MarketingSchema);