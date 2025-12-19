import { CompleteProfileForm } from './ui/CompleteProfileForm';

export default function CompleteProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4">
      <div className="flex flex-col w-full max-w-md">
        <h1 className="text-3xl sm:text-4xl mb-6 text-center font-bold">
          Completa tu perfil
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Necesitamos tu número de teléfono para completar tu registro
        </p>
        <CompleteProfileForm />
      </div>
    </div>
  );
}
