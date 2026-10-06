import { model, Schema } from 'mongoose';

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    author: { type: String, required: true, trim: true, maxlength: 100 },
    publishedYear: { type: Number, required: true, min: 1400 },
    available: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_document, result) => {
        const { _id, ...book } = result;
        return { ...book, id: _id.toString() };
      },
    },
  },
);

export const BookModel = model('Book', bookSchema);
