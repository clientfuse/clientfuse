import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './services/billing.service';
import { WebhookService } from './services/webhook.service';
import { StripeService } from '../../core/modules/stripe/stripe.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from './dto/create-portal-session.dto';
import { Public } from '../auth/decorators/is-public.decorator';
import { ConfigService } from '@nestjs/config';
import {
  ICreateCheckoutSessionResponse,
  ICreatePortalSessionResponse,
  ISubscriptionResponse,
  ISubscriptionPlan,
  ENDPOINTS, ApiEnv
} from '@clientfuse/models';

@Controller(ENDPOINTS.billing.root)
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private billingService: BillingService,
    private webhookService: WebhookService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  @Post(ENDPOINTS.billing.checkoutSession)
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @Req() req,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<ICreateCheckoutSessionResponse> {
    const userId = req.user._id;
    const result = await this.billingService.createCheckoutSession(userId, dto);

    return result;
  }

  @Post(ENDPOINTS.billing.portalSession)
  @HttpCode(HttpStatus.OK)
  async createPortalSession(
    @Req() req,
    @Body() dto: CreatePortalSessionDto,
  ): Promise<ICreatePortalSessionResponse> {
    const userId = req.user._id;
    const result = await this.billingService.createPortalSession(userId, dto);

    return result;
  }

  @Get(ENDPOINTS.billing.subscription)
  @HttpCode(HttpStatus.OK)
  async getSubscription(@Req() req): Promise<ISubscriptionResponse> {
    const userId = req.user._id;
    const subscription = await this.billingService.getSubscription(userId);

    return subscription;
  }

  @Get(ENDPOINTS.billing.plans)
  @HttpCode(HttpStatus.OK)
  async getPlans(): Promise<ISubscriptionPlan[]> {
    const plans = await this.billingService.getPlans();

    return plans;
  }

  /**
   * Webhook endpoint for Stripe events
   * Must be public (bypass JWT auth) and handle raw body for signature verification
   */
  @Post(ENDPOINTS.billing.webhook)
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const webhookSecret = this.configService.get<string>(ApiEnv.STRIPE_WEBHOOK_SECRET);
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      const rawBody = req.rawBody;
      if (!rawBody) {
        throw new BadRequestException('Missing request body');
      }

      const event = this.stripeService.verifyWebhookSignature(
        rawBody,
        signature,
        webhookSecret,
      );

      await this.webhookService.handleEvent(event as any);

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook processing failed', error);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}
