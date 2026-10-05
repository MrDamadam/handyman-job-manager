package com.adamaleweidat.handymanager.validation;

import com.adamaleweidat.handymanager.invoice.Invoice;
import com.adamaleweidat.handymanager.job.Job;
import com.adamaleweidat.handymanager.payment.Payment;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AmountValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setup() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void cleanup() {
        factory.close();
    }

    @ParameterizedTest(name = "amount={0}: payment valid={1}, invoice/job valid={2}")
    @CsvSource(
            nullValues = "NULL",
            value = {
                    "NULL, false, false",
                    "-0.01, false, false",
                    "0.00, false, true",
                    "0.01, true, true",
                    "125.50, true, true"
            }
    )
    void validatesAmounts(
            String input,
            boolean paymentValid,
            boolean invoiceAndJobValid
    ) {
        BigDecimal amount = input == null ? null : new BigDecimal(input);

        assertEquals(
                paymentValid,
                validator.validateValue(Payment.class, "amount", amount).isEmpty(),
                "Payment amount"
        );

        assertEquals(
                invoiceAndJobValid,
                validator.validateValue(Invoice.class, "amount", amount).isEmpty(),
                "Invoice amount"
        );

        assertEquals(
                invoiceAndJobValid,
                validator.validateValue(Job.class, "estimatedAmount", amount).isEmpty(),
                "Job estimated amount"
        );
    }
}
