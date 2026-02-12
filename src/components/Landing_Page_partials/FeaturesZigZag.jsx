import React from "react";
import { FiCheck } from "react-icons/fi";
import Image from "next/image";

function FeaturesZigzag({ images }) {
  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <br />
        <div className="py-12 md:py-20 border-t border-gray-800">
          <br />
          <br />
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
            <h1 className="h2 mb-4">One product, unlimited solutions</h1>
            <p className="text-xl text-gray-500">
              Our platform provides a range of features, including event
              creation and the ability to take registrations, all while
              accommodating multiple admins.
            </p>
          </div>

          {/* Items */}
          <div className="grid gap-20">
            {/* 1st item */}
            <div className="md:grid md:grid-cols-12 md:gap-6 items-center">
              {/* Image */}
              <div
                className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:order-1"
                data-aos="fade-up"
              >
                <Image
                  className="max-w-full mx-auto md:max-w-none h-auto"
                  src={images[0].src}
                  width={540}
                  height={405}
                  alt={images[0].title}
                />
              </div>
              {/* Content */}
              <div
                className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6"
                data-aos="fade-right"
              >
                <div className="md:pr-4 lg:pr-12 xl:pr-16">
                  <div className="text-xl text-[color:var(--darker-secondary-color)] mb-2">
                    More speed. High efficiency
                  </div>
                  <h3 className="h3 mb-3">Keep events on schedule</h3>
                  <p className="text-xl text-gray-500 mb-4">
                    In order to organize an event, you must log in as an event
                    manager. The platform owner can assign event managers, or
                    you may use test credentials. After logging in, you can
                    begin managing the event.
                  </p>
                  <ul className="text-lg text-gray-500 -mb-2">
                    <li className="flex items-center mb-2">
                      <FiCheck className="w-3 h-3 text-green-500 mr-2" />
                      <span>You will have your own dashboard</span>
                    </li>
                    <li className="flex items-center mb-2">
                      <FiCheck className="w-3 h-3 text-green-500 mr-2" />
                      <span>Fill details and schedule your events</span>
                    </li>
                    <li className="flex items-center">
                      <FiCheck className="w-3 h-3 text-green-500 mr-2" />
                      <span>Secure and quick access</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 2nd item */}
            <div className="md:grid md:grid-cols-12 md:gap-6 items-center">
              {/* Image */}
              <div
                className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 rtl"
                data-aos="fade-up"
              >
                <Image
                  className="max-w-full mx-auto md:max-w-none h-auto"
                  src={images[1].src}
                  width={540}
                  height={405}
                  alt={images[1].title}
                />
              </div>
              {/* Content */}
              <div
                className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6"
                data-aos="fade-left"
              >
                <div className="md:pl-4 lg:pl-12 xl:pl-16">
                  <div className="font-architects-daughter text-xl text-[color:var(--darker-secondary-color)] mb-2">
                    Super easy. Quick booking
                  </div>
                  <h3 className="h3 mb-3">Book your favourite shows</h3>
                  <p className="text-xl text-gray-500 mb-4">
                    On users dashboard, users can view all available events,
                    select their preferred event, and proceed with the booking
                    process.
                  </p>
                  <ul className="text-lg text-gray-500 -mb-2">
                    <li className="flex items-center mb-2">
                      <FiCheck className="w-3 h-3 text-green-500 mr-2" />
                      <span>Generate online tickets for the event</span>
                    </li>
                    <li className="flex items-center mb-2">
                      <FiCheck className="w-3 h-3 text-green-500 mr-2" />
                      <span>Make online payment through cards</span>
                    </li>
                    <li className="flex items-center">
                      <FiCheck className="w-3 h-3 text-green-500 mr-2" />
                      <span>
                        Stay informed about the events you&apos;ve registered
                        for.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3rd item */}
            <div className="md:grid md:grid-cols-12 md:gap-6 items-center">
              {/* Image */}
              <div
                className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-8 md:mb-0 md:order-1"
                data-aos="fade-up"
              >
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 transform hover:scale-[1.02] transition-transform duration-500">
                    <Image
                    className="max-w-full mx-auto md:max-w-none h-auto w-full"
                    src={images[2].src}
                    width={540}
                    height={405}
                    alt={images[2].title}
                    />
                </div>
              </div>
              {/* Content */}
              <div
                className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6"
                data-aos="fade-right"
              >
                <div className="md:pr-4 lg:pr-12 xl:pr-16">
                  <div className="text-lg font-bold text-[color:var(--secondary-color)] mb-2 uppercase tracking-wide">
                    More speed. High efficiency
                  </div>
                  <h3 className="text-3xl font-bold mb-3 text-gray-900 font-heading">Ticket delivery on time</h3>
                  <p className="text-lg text-gray-500 mb-6 leading-relaxed">
                    Users will be able to download their tickets in the form of
                    pdf. Each ticket will be having a unique QR code. The user
                    can also view their past tickets.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center text-gray-600 font-medium">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <FiCheck className="w-3 h-3 text-green-600" />
                      </div>
                      <span>Book and download tickets</span>
                    </li>
                    <li className="flex items-center text-gray-600 font-medium">
                       <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <FiCheck className="w-3 h-3 text-green-600" />
                      </div>
                      <span>Show tickets on the entrance</span>
                    </li>
                    <li className="flex items-center text-gray-600 font-medium">
                       <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <FiCheck className="w-3 h-3 text-green-600" />
                      </div>
                      <span>Quick verification</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesZigzag;
